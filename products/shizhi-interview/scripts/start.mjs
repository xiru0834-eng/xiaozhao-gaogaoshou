/** Runs the local product exclusively through its isolated dsh Web profile. */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const envPath = join(root, '.env')
if (existsSync(envPath)) process.loadEnvFile(envPath)
const env = { ...process.env, DSH_HOME: process.env.DSH_HOME || join(root, '.dsh-home') }
const port = process.env.SHIZHI_PORT || '4317'
if (!/^\d+$/.test(port) || Number(port) > 65535) throw new Error('SHIZHI_PORT must be between 0 and 65535')
const require = createRequire(import.meta.url)
const cli = join(dirname(require.resolve('@deepseek-ai/dsh/package.json')), 'lib', 'bin.js')
let child
let interrupted = false
const stop = () => { interrupted = true; child?.kill() }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
function launch(args) {
  return new Promise((resolve, reject) => {
    child = spawn(process.execPath, [cli, ...args], { cwd: root, env, stdio: 'inherit', windowsHide: true })
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      child = null
      if (interrupted) resolve(0)
      else if (signal || code !== 0) reject(new Error(`dsh exited with ${signal || code}`))
      else resolve(code)
    })
  })
}
try {
  const manifestPath = join(env.DSH_HOME, 'profiles', 'web', 'package.json')
  const installed = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null
  const link = `link:${root.replaceAll('\\', '/')}`
  if (installed?.dependencies?.['@deepseek-ai/dsh-shizhi-interview'] !== link) {
    await launch(['plugin', '--profile', 'web', 'add', link, '--store-dir', env.SHIZHI_PNPM_STORE || join(env.DSH_HOME, 'pnpm-store')])
  }
  if (!interrupted) await launch(['web', '--patch', join(root, 'scripts', 'browser-picker.yml'),
    '--no-open', '--host', '127.0.0.1', '--port', port])
} finally {
  process.off('SIGINT', stop)
  process.off('SIGTERM', stop)
}
