/** Starts the bundled official dsh CLI against a separate writable data home. */
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile, lstat, realpath, symlink, unlink, rename } from 'node:fs/promises'
import { join, delimiter, dirname } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const bundles = ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', '@deepseek-ai/dsh-shizhi-interview', '@shizhi/desktop-bridge']

/** Seeds a desktop-owned profile without modifying any existing records or user patch.
 * @param {string} home Writable Harness data home.
 */
export async function prepareHome(home) {
  const profile = join(home, 'profiles', 'web')
  await mkdir(profile, { recursive: true })
  const file = join(profile, 'package.json')
  let previous
  try { previous = JSON.parse(await readFile(file, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
  if (previous) {
    if (JSON.stringify(previous.dsh?.profile?.bundles) !== JSON.stringify(bundles)) throw new Error('桌面数据目录中的运行配置不兼容，请保留数据并联系开发者')
    return
  }
  await writeFile(file, JSON.stringify({ name: 'shizhi-desktop-profile', private: true,
    dependencies: { '@deepseek-ai/dsh-shizhi-interview': '0.1.0', '@shizhi/desktop-bridge': '0.1.0' },
    dsh: { profile: { bundles } } }, null, 2), { flag: 'wx' })
}

async function linkBundles(home, runtime) {
  // dsh resolves profile bundle imports through its installed direct-dependency paths.
  // Junctions are created in the writable home, never carried inside an installation package.
  for (const name of bundles.slice(2)) {
    const link = join(home, 'profiles/web/node_modules', name)
    const target = join(runtime, 'node_modules', name)
    await mkdir(dirname(link), { recursive: true })
    let info
    try { info = await lstat(link) } catch (error) { if (error.code !== 'ENOENT') throw error }
    if (info) {
      if (!info.isSymbolicLink()) throw new Error(`桌面插件路径被其他文件占用：${link}`)
      if ((await realpath(link).catch((error) => { if (error.code === 'ENOENT') return ''; throw error })).toLowerCase() === target.toLowerCase()) continue
      await unlink(link)
    }
    await symlink(target, link, 'junction')
  }
}

async function awaitProduct(url, signal) {
  const timed = () => signal ? AbortSignal.any([signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000)
  const exchange = await fetch(url, { redirect: 'manual', signal: timed() })
  const cookie = exchange.headers.getSetCookie().map((part) => part.split(';')[0]).join('; ')
  await exchange.body?.cancel()
  if (exchange.status !== 303 || !cookie) throw new Error('无法建立工作台的本机连接')
  const deadline = Date.now() + 30000
  // Product storage opens asynchronously after Harness begins serving the page.
  while (Date.now() < deadline) {
    signal?.throwIfAborted()
    const response = await fetch(new URL('/interview/api/question-bank', url), { headers: { cookie }, signal: timed() })
    await response.body?.cancel()
    if (response.status === 200) return
    if (response.status !== 404) throw new Error(`工作台初始化失败（${response.status}）`)
    await delay(100, undefined, { signal })
  }
  throw new Error('工作台初始化超时，请重试')
}

/** Allows only the authenticated loopback server origin as embedded content.
 * @param {string} raw Backend URL.
 * @returns {URL} Validated URL.
 */
export function privateServerUrl(raw) {
  const url = new URL(raw)
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.username || url.password) throw new Error('后台返回了不受信任的地址')
  return url
}

/** Starts once, returns an authenticated URL, and owns a bounded graceful stop.
 * @param {object} options Runtime path, writable home, credentials and optional failure callback.
 * @returns {Promise<object>} Private URL, process ID and idempotent stop.
 */
export async function startBackend({ runtime, home, settings = {}, onExit = () => {}, timeoutMs = 90000, signal, port }) {
  signal?.throwIfAborted()
  await prepareHome(home)
  await linkBundles(home, runtime)
  signal?.throwIfAborted()
  const portFile = join(home, 'desktop-port.json')
  if (port === undefined) {
    let saved
    try { saved = JSON.parse(await readFile(portFile, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
    port = saved?.port ?? 0
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('桌面连接端口配置损坏')
  }
  const node = join(runtime, 'node.exe')
  const cli = join(runtime, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')
  const env = {}
  // Only OS, proxy and locale values cross into the service; no inherited API keys or NODE_OPTIONS.
  for (const [key, value] of Object.entries(process.env)) {
    if (/^(SystemRoot|WINDIR|COMSPEC|TEMP|TMP|USERPROFILE|APPDATA|LOCALAPPDATA|PROGRAMDATA|ProgramFiles|ProgramFiles\(x86\)|PATHEXT|PATH|HTTP_PROXY|HTTPS_PROXY|NO_PROXY|LANG)$/i.test(key)) env[key] = value
  }
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') || 'PATH'
  env[pathKey] = `${dirname(node)}${delimiter}${env[pathKey] || ''}`
  Object.assign(env, { DSH_HOME: home, DSH_TELEMETRY_DISABLED: '1', DEEPSEEK_API_KEY: settings.deepseekKey || '',
    SHIZHI_ASR_PROVIDER: 'qwen', SHIZHI_ASR_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    SHIZHI_ASR_MODEL: 'qwen3-asr-flash', SHIZHI_ASR_API_KEY: settings.qwenKey || '' })
  const child = spawn(node, [cli, 'web', '--no-open', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: home, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  })
  let stopping = false
  let stopPromise
  let errorTail = ''
  // Never forward startup token URLs or provider credentials into desktop logs.
  const collectDiagnostic = (chunk) => {
    let text = chunk.toString().replace(/https?:\/\/\S+|sk-[\w-]+/g, '[redacted]')
    for (const key of [settings.deepseekKey, settings.qwenKey]) if (key) text = text.replaceAll(key, '[redacted]')
    errorTail = (errorTail + text).slice(-2500)
  }
  child.stdout.on('data', collectDiagnostic)
  child.stderr.on('data', collectDiagnostic)
  let finished = false
  let exitCode
  const closed = new Promise((resolve) => {
    child.once('close', (code) => { finished = true; exitCode = code; resolve(code); if (!stopping) onExit(code) })
  })
  const stop = () => stopPromise ??= (async () => {
    stopping = true
    if (finished) return { code: exitCode, forced: false }
    if (child.connected) child.send({ type: 'shizhi:shutdown' }, () => {})
    let forced = false
    const timer = setTimeout(() => { forced = true; child.kill() }, 8000)
    try { return { code: await closed, forced } } finally { clearTimeout(timer) }
  })()
  const abort = () => { void stop() }
  signal?.addEventListener('abort', abort, { once: true })
  void closed.then(() => signal?.removeEventListener('abort', abort))
  try {
    const url = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error('后台启动超时，请重新打开应用；若持续出现，请联系开发者')), timeoutMs)
      const finish = (error, value) => {
        clearTimeout(timer)
        child.off('message', message); child.off('error', fail); child.off('exit', earlyExit)
        if (error) reject(error); else resolve(value)
      }
      const fail = () => finish(new Error('无法启动内置 Node 运行环境'))
      const earlyExit = (code) => finish(new Error(`后台启动失败（退出码 ${code}），请重新打开应用；若持续出现，请联系开发者`))
      const message = (value) => {
        if (value?.type !== 'shizhi:ready') return
        try { finish(null, privateServerUrl(value.url).href) } catch (error) { finish(error) }
      }
      child.once('error', fail); child.once('exit', earlyExit); child.on('message', message)
    })
    await awaitProduct(url, signal)
    await writeFile(`${portFile}.tmp`, JSON.stringify({ port: Number(new URL(url).port) }))
    await rename(`${portFile}.tmp`, portFile)
    return { url, pid: child.pid, stop }
  } catch (error) {
    await stop()
    if (port !== 0 && /EADDRINUSE|address already in use/i.test(errorTail) && !signal?.aborted) {
      return startBackend({ runtime, home, settings, onExit, timeoutMs, signal, port: 0 })
    }
    throw error
  }
}
