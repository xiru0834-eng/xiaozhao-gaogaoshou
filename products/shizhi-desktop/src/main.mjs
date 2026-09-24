/** Electron owns windows and OS integration; the official dsh process owns product data. */
import { app, BrowserWindow, Menu, dialog, ipcMain, safeStorage, shell, session } from 'electron'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { startBackend } from './backend.mjs'
import { mergeSettings, readSettings, saveSettings, settingsStatus } from './settings.mjs'

const source = dirname(fileURLToPath(import.meta.url))
const setupFile = join(source, 'setup.html')
const setupUrl = pathToFileURL(setupFile).href
// Release and development use different homes; neither reads the source deployment's .env.
app.setPath('userData', join(app.getPath('appData'), app.isPackaged ? 'XiaozhaoShizhi' : 'XiaozhaoShizhi-Dev'))
const home = join(app.getPath('userData'), 'data')
const settingsFile = join(app.getPath('userData'), 'desktop-credentials.json')
const runtime = app.isPackaged ? join(process.resourcesPath, 'backend') : join(source, '..', 'build', 'backend')
let backend, productWindow, setupWindow, settings = {}, starting = false, quitting = false, canQuit = false
let launching
const lifetime = new AbortController()

if (!app.requestSingleInstanceLock()) app.quit()
else {
  app.on('second-instance', () => {
    const window = setupWindow || productWindow
    if (window?.isMinimized()) window.restore()
    window?.show(); window?.focus()
  })
  app.on('before-quit', (event) => {
    if (canQuit) return
    event.preventDefault()
    if (quitting) return
    quitting = true
    lifetime.abort()
    void (async () => {
      try { await launching?.catch(() => {}); await backend?.stop() } finally { canQuit = true; app.quit() }
    })()
  })
  app.on('window-all-closed', () => app.quit())
  app.on('activate', () => { (productWindow || setupWindow)?.show() })
  void app.whenReady().then(async () => {
  session.defaultSession.setPermissionCheckHandler((contents, permission, origin, details) => {
    return contents === productWindow?.webContents && trustedUrl(origin) &&
      (permission === 'clipboard-sanitized-write' || permission === 'media' && details.mediaType === 'audio')
  })
  session.defaultSession.setPermissionRequestHandler((contents, permission, callback, details) => {
    const allowed = contents === productWindow?.webContents && trustedUrl(details.requestingUrl) &&
      (permission === 'clipboard-sanitized-write' || permission === 'media' && details.mediaTypes?.every((type) => type === 'audio'))
    callback(Boolean(allowed))
  })
  session.defaultSession.on('will-download', (_event, item) => item.setSaveDialogOptions({ title: '保存导出文件' }))
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: '校招高手', submenu: [
      { label: '模型与语音配置…', accelerator: 'CmdOrCtrl+,', click: () => showSetup(false) },
      { label: '打开数据文件夹', click: () => void shell.openPath(app.getPath('userData')) },
      { type: 'separator' }, { label: '退出', role: 'quit' },
    ] },
    { label: '编辑', submenu: [{ role: 'undo', label: '撤销' }, { role: 'redo', label: '重做' }, { type: 'separator' },
      { role: 'cut', label: '剪切' }, { role: 'copy', label: '复制' }, { role: 'paste', label: '粘贴' }, { role: 'selectAll', label: '全选' }] },
    { label: '视图', submenu: [{ role: 'reload', label: '刷新' }, { role: 'resetZoom', label: '实际大小' },
      { role: 'zoomIn', label: '放大' }, { role: 'zoomOut', label: '缩小' }, { role: 'togglefullscreen', label: '全屏' }] },
  ]))
  ipcMain.handle('desktop:status', (event) => { authorize(event); return { ...settingsStatus(settings), running: Boolean(backend) } })
  ipcMain.handle('desktop:launch', async (event, input) => {
    authorize(event)
    if (starting) return { error: '正在启动，请稍候' }
    starting = true
    try {
      if (input !== null) {
        const updated = mergeSettings(input, settings)
        await saveSettings(settingsFile, updated, safeStorage)
        settings = updated
      }
      await backend?.stop(); backend = undefined
      productWindow?.destroy(); productWindow = undefined
      await launchProduct()
      setupWindow?.destroy(); setupWindow = undefined
      return { ok: true }
    } catch (error) {
      return { error: error.message }
    } finally { starting = false }
  })
  try {
    settings = await readSettings(settingsFile, safeStorage)
    showSetup(Boolean(settings.configured))
  } catch (error) {
    dialog.showErrorBox('配置读取失败', `${error.message}\n原配置已保留。请通过数据文件夹备份后再处理。`)
    app.quit()
  }
  }).catch((error) => { dialog.showErrorBox('桌面启动失败', error.message); app.quit() })
}

function serverOrigin() { return backend ? new URL(backend.url).origin : '' }
function trustedUrl(raw) { try { return Boolean(backend) && new URL(raw).origin === serverOrigin() } catch { return false } }
function authorize(event) {
  if (event.sender !== setupWindow?.webContents || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url.split('?')[0] !== setupUrl) throw new Error('不允许的配置请求')
}
function openExternal(raw) {
  try {
    const url = new URL(raw)
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && !trustedUrl(raw)) void shell.openExternal(url.href)
  } catch { /* Malformed navigation is denied. */ }
}
function showSetup(autoStart) {
  if (quitting || starting) return
  if (setupWindow) { setupWindow.show(); setupWindow.focus(); return }
  setupWindow = new BrowserWindow({ width: 820, height: 760, minWidth: 640, minHeight: 650, title: '校招高手 · 模型与语音',
    backgroundColor: '#f3f6f7', autoHideMenuBar: true,
    webPreferences: { preload: join(source, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } })
  setupWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  setupWindow.webContents.on('will-navigate', (event) => event.preventDefault())
  setupWindow.on('closed', () => { setupWindow = undefined })
  void setupWindow.loadFile(setupFile, { query: { auto: autoStart ? '1' : '0' } })
}
async function launchProduct() {
  launching = startBackend({ runtime, home, settings, signal: lifetime.signal, onExit: () => {
    if (quitting || starting) return
    backend = undefined
    showSetup(false)
    productWindow?.destroy(); productWindow = undefined
    dialog.showErrorBox('后台已停止', '练习记录仍保存在本机。请重新启动；若反复出现，请将启动错误交给开发者排查。')
  } })
  try { backend = await launching } finally { launching = undefined }
  if (quitting) return
  productWindow = new BrowserWindow({ width: 1440, height: 940, minWidth: 880, minHeight: 620, show: false,
    title: '校招高手 × 拾知面试陪练', backgroundColor: '#f3f6f7',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } })
  productWindow.webContents.setWindowOpenHandler(({ url }) => { openExternal(url); return { action: 'deny' } })
  productWindow.webContents.on('will-navigate', (event, url) => { if (!trustedUrl(url)) { event.preventDefault(); openExternal(url) } })
  productWindow.webContents.on('will-frame-navigate', (event) => { if (!trustedUrl(event.url)) event.preventDefault() })
  productWindow.webContents.on('will-attach-webview', (event) => event.preventDefault())
  productWindow.on('page-title-updated', (event) => event.preventDefault())
  productWindow.on('closed', () => { productWindow = undefined })
  await productWindow.loadURL(backend.url)
  productWindow.show()
}
