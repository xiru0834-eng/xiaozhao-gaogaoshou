/** Runs the real Electron main/preload/setup flow with a disposable user-data root. */
import { app, BrowserWindow, safeStorage } from 'electron'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { verifyAppearance } from './smoke-appearance.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const temporary = await mkdtemp(join(root, 'build', 'desktop-smoke-'))
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('use-fake-device-for-media-stream')
app.setPath('appData', temporary)
const rendererErrors = []
app.on('web-contents-created', (_event, contents) => contents.on('console-message', (event) => {
  if (event.level === 'error') rendererErrors.push(event.message)
}))
const timer = setTimeout(() => { console.error('Desktop smoke timed out'); app.exit(1) }, 90000)
async function until(get, description) {
  const deadline = Date.now() + 30000
  while (Date.now() < deadline) {
    const value = await get()
    if (value) return value
    await delay(100)
  }
  throw new Error(`Timed out: ${description}`)
}
await import('../src/main.mjs')
async function runSmoke() {
try {
  const setup = await until(() => BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().startsWith('file:') && !window.webContents.isLoading()), 'configuration page')
  assert.deepEqual(await setup.webContents.executeJavaScript('window.desktop.status()'), { configured: false, deepseek: false, qwen: false, running: false })
  assert.equal(await setup.webContents.executeJavaScript('typeof require'), 'undefined')
  console.log('Setup and preload checks passed.')
  await setup.webContents.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
  const firstRun = await setup.webContents.capturePage()
  await writeFile(join(root, 'build', 'desktop-setup.png'), firstRun.toPNG())
  void setup.webContents.executeJavaScript('window.desktop.launch({})').catch(() => { /* Successful launch disposes its setup renderer. */ })
  const product = await until(() => BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().startsWith('http://127.0.0.1:') && !window.webContents.isLoading()), 'workbench window')
  await until(async () => (await product.webContents.executeJavaScript('document.body.innerText')).includes('校招工作台'), 'integrated workbench content')
  await until(() => product.webContents.executeJavaScript('Boolean(document.querySelector(".sz-shell-frame .sz-shell-header"))'), 'product header replaces framework sidebar')
  const clickText = async (text, scope = 'body') => product.webContents.executeJavaScript(`(() => {
    const button = [...document.querySelectorAll(${JSON.stringify(scope)} + ' button')].find(item => item.textContent.trim() === ${JSON.stringify(text)} && item.getClientRects().length);
    if (!button) return false; button.click(); return true;
  })()`)
  await until(() => clickText('继续', '[role="dialog"]'), 'first-run notice')
  await until(() => clickText('稍后配置', '[role="dialog"]'), 'keyless onboarding')
  const geometry = await product.webContents.executeJavaScript(`(() => {
    const main = document.querySelector('.sz-shell-main-column').getBoundingClientRect();
    const header = document.querySelector('.sz-shell-header').getBoundingClientRect();
    return { left:main.left, top:main.top, width:main.width, viewport:innerWidth, headerBottom:header.bottom,
      frameworkBrand:document.querySelector('.sz-shell-header').textContent.includes('DeepSeek') };
  })()`)
  assert.equal(geometry.left, 0, 'no empty sidebar track')
  assert.equal(geometry.width, geometry.viewport, 'workbench uses the window width')
  assert.equal(geometry.top, geometry.headerBottom)
  assert.equal(geometry.frameworkBrand, false)
  assert.equal(await clickText('历史会话', '.sz-shell-header'), true)
  await until(() => product.webContents.executeJavaScript(`Boolean(document.querySelector('.sz-shell-history[open] [data-slot="sidebar.workspaces"]'))`), 'history browser')
  await product.webContents.executeJavaScript(`document.querySelector('.sz-shell-history button[aria-label]').click()`)
  assert.equal(await product.webContents.executeJavaScript('document.querySelector(".sz-shell-history").open'), false)
  await until(() => product.webContents.executeJavaScript('document.activeElement.textContent.trim() === "历史会话"'), 'history restores keyboard focus')
  await product.webContents.executeJavaScript('document.querySelector(".sz-shell-settings button[aria-haspopup=dialog]").click()')
  await until(() => clickText('模型', '[role="dialog"]'), 'model settings reachable from header')
  product.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' })
  product.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' })
  await until(() => product.webContents.executeJavaScript('!document.querySelector("[role=dialog]")'), 'settings close')
  await verifyAppearance({ product, until, clickText, output: join(root, 'build') })
  assert.equal(await clickText('历史会话', '.sz-shell-header'), true)
  assert.equal(await clickText('插件管理', '.sz-shell-history'), true)
  await until(() => product.webContents.executeJavaScript('!document.querySelector(".sz-product")'), 'plugin page')
  assert.equal(await clickText('返回工作台', '.sz-shell-header'), true)
  await until(() => product.webContents.executeJavaScript('Boolean(document.querySelector(".sz-product"))'), 'return from global page')
  assert.equal(await clickText('面试陪练', '.sz-product-nav'), true)
  await until(() => product.webContents.executeJavaScript('document.querySelector(".sz-home")?.getClientRects().length > 0'), 'coach navigation')
  await product.webContents.executeJavaScript('Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})))')
  await writeFile(join(root, 'build', 'desktop-coach.png'), (await product.webContents.capturePage()).toPNG())
  product.setFullScreen(false)
  product.unmaximize()
  await until(() => !product.isMaximized() && !product.isFullScreen(), 'window leaves maximized state')
  product.setSize(900, 740)
  await until(() => product.webContents.executeJavaScript('innerWidth < 1000'), 'narrow window')
  assert.equal(await product.webContents.executeJavaScript('document.querySelector(".sz-shell-main-column").getBoundingClientRect().left'), 0)
  assert.equal(await product.webContents.executeJavaScript('document.documentElement.scrollWidth <= innerWidth'), true)
  product.setSize(1440, 940)
  assert.equal(await clickText('校招工作台', '.sz-product-nav'), true)
  assert.equal(await product.webContents.executeJavaScript('typeof require'), 'undefined')
  assert.equal(await product.webContents.executeJavaScript('typeof window.desktop'), 'undefined')
  const preferences = product.webContents.getLastWebPreferences()
  assert.equal(preferences.sandbox, true)
  assert.equal(preferences.contextIsolation, true)
  const audio = await product.webContents.executeJavaScript('navigator.mediaDevices.getUserMedia({audio:true}).then(stream => { stream.getTracks().forEach(track => track.stop()); return true; }).catch(error => error.name)')
  assert.equal(audio, true, 'audio permission is available to the local workbench')
  const video = await product.webContents.executeJavaScript('navigator.mediaDevices.getUserMedia({video:true}).then(stream => { stream.getTracks().forEach(track => track.stop()); return "unexpected"; }).catch(error => error.name)')
  assert.equal(video, 'NotAllowedError', 'camera permission remains denied')
  const clipboardWrite = await product.webContents.executeJavaScript('navigator.permissions.query({name:"clipboard-write",allowWithoutGesture:false,allowWithoutSanitization:false}).then(permission => permission.state)')
  assert.equal(clipboardWrite, 'granted', 'local copy buttons retain clipboard write permission')
  await product.webContents.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
  await writeFile(join(root, 'build', 'desktop-workbench.png'), (await product.webContents.capturePage()).toPNG())
  assert.deepEqual(rendererErrors, [], 'no renderer errors')
  const credentials = JSON.parse(await readFile(join(app.getPath('userData'), 'desktop-credentials.json'), 'utf8'))
  assert.equal(credentials.version, 1)
  assert.equal(JSON.parse(safeStorage.decryptString(Buffer.from(credentials.encrypted, 'base64'))).configured, true)
  console.log('PASS: desktop startup, full-width product header, history, model settings, coach navigation, narrow layout and renderer isolation.')
  clearTimeout(timer)
  app.quit()
} catch (error) {
  const failed = BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().startsWith('http://127.0.0.1:'))
  if (failed) await writeFile(join(root, 'build', 'desktop-failure.png'), (await failed.webContents.capturePage()).toPNG())
  console.error(error)
  clearTimeout(timer)
  app.once('will-quit', () => app.exit(1))
  app.quit()
}
}
void runSmoke()
