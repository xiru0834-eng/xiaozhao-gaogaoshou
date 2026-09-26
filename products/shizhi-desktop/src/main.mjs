/** Electron owns windows and OS integration; the official dsh process owns product data. */
import { app, BrowserWindow, Menu, dialog, ipcMain, safeStorage, shell, session } from 'electron'
import { join, dirname, resolve, sep } from 'node:path'
import { writeFile, rename, readFile, rm } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { startBackend } from './backend.mjs'
import { mergeSettings, readSettings, saveSettings, settingsStatus } from './settings.mjs'
import { createBackup, readBackup, stageRestore } from './backup.mjs'

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
let maintenance
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
    void (async () => {
      try {
        await maintenance?.catch(() => {})
        if (productWindow && !productWindow.isDestroyed()) await productWindow.webContents.executeJavaScript('window.shizhiSaveDrafts?.()')
      } catch (error) { quitting = false; dialog.showErrorBox('草稿尚未保存', '请先复制当前回答，或重试保存后再关闭应用。'); return }
      lifetime.abort()
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
      { label: '设置…', accelerator: 'CmdOrCtrl+,', click: () => productWindow ? void productWindow.webContents.executeJavaScript('document.querySelector(".sz-open-settings")?.click()') : showSetup(false) },
      { label: '打开数据文件夹', click: () => void shell.openPath(app.getPath('userData')) },
      { type: 'separator' }, { label: '退出', role: 'quit' },
    ] },
    { label: '编辑', submenu: [{ role: 'undo', label: '撤销' }, { role: 'redo', label: '重做' }, { type: 'separator' },
      { role: 'cut', label: '剪切' }, { role: 'copy', label: '复制' }, { role: 'paste', label: '粘贴' }, { role: 'selectAll', label: '全选' }] },
    { label: '视图', submenu: [{ role: 'reload', label: '刷新' }, { role: 'resetZoom', label: '实际大小' },
      { role: 'zoomIn', label: '放大' }, { role: 'zoomOut', label: '缩小' }, { role: 'togglefullscreen', label: '全屏' }] },
  ]))
  ipcMain.handle('desktop:status', (event) => { authorize(event); return { ...settingsStatus(settings), running: Boolean(backend) } })
  ipcMain.handle('product:status', (event) => { authorizeProduct(event); return { ...settingsStatus(settings), version: app.getVersion() } })
  ipcMain.handle('product:open-data', (event) => { authorizeProduct(event); return shell.openPath(app.getPath('userData')) })
  for (const action of ['configure', 'backup', 'restore']) ipcMain.handle(`product:${action}`, (event, input) => {
    authorizeProduct(event)
    if (starting || quitting) return { error: '正在处理，请稍候' }
    starting = true
    maintenance = maintainProduct(action, input).catch((error) => ({ error: error.message })).finally(() => { starting = false; maintenance = undefined })
    return maintenance
  })
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
function authorizeProduct(event) {
  if (event.sender !== productWindow?.webContents || event.senderFrame !== event.sender.mainFrame || !trustedUrl(event.senderFrame.url)) throw new Error('不允许的桌面请求')
}

async function maintainProduct(action, input) {
  let file, payload, restore, stopped = false, committed = false
  const previousSettings = settings
  const credentials = await readFile(settingsFile).catch((error) => { if (error.code !== 'ENOENT') throw error; return null })
  if (action === 'backup') {
    const choice = await dialog.showSaveDialog(productWindow, { title: '导出完整备份', defaultPath: `Xiaozhao-${new Date().toISOString().slice(0, 10)}.szbackup`, filters: [{ name: '拾知加密备份', extensions: ['szbackup'] }] })
    if (choice.canceled) return { cancelled: true }
    file = choice.filePath
    if ((resolve(file) + sep).toLowerCase().startsWith((resolve(app.getPath('userData')) + sep).toLowerCase())) throw new Error('请将备份保存到应用数据目录以外')
  } else if (action === 'restore') {
    const choice = await dialog.showOpenDialog(productWindow, { title: '选择完整备份', properties: ['openFile'], filters: [{ name: '拾知加密备份', extensions: ['szbackup'] }] })
    if (choice.canceled) return { cancelled: true }
    payload = await readBackup(choice.filePaths[0], input?.password)
    payload.settings = mergeSettings(payload.settings)
    const confirmation = await dialog.showMessageBox(productWindow, { type: 'question', buttons: ['取消', '恢复并替换'], defaultId: 0, cancelId: 0,
      title: '恢复完整备份', message: '用备份替换当前记录和配置？', detail: `备份时间：${payload.createdAt}\n请先导出当前数据。恢复失败会自动回滚。` })
    if (confirmation.response !== 1) return { cancelled: true }
  }
  try {
    const closed = await backend.stop(); backend = undefined; stopped = true
    if (closed.forced || closed.code !== 0) throw new Error('后台未正常结束，本次操作已取消，请重试')
    if (action === 'backup') {
      const bytes = await createBackup(home, settings, input?.password, checkedPreferences(input?.preferences))
      const temporary = `${file}.${randomUUID()}.tmp`
      await writeFile(temporary, bytes, { mode: 0o600, flag: 'wx' })
      try { await rename(temporary, file) } finally { await rm(temporary, { force: true }) }
    } else if (action === 'restore') {
      restore = await stageRestore(home, payload)
      await saveSettings(settingsFile, payload.settings, safeStorage); settings = payload.settings
    } else {
      const updated = mergeSettings(input, settings)
      await saveSettings(settingsFile, updated, safeStorage); settings = updated
    }
    await launchProduct()
    if (payload) {
      const preferences = checkedPreferences(payload.preferences)
      await productWindow.webContents.executeJavaScript(`Object.entries(${JSON.stringify(preferences)}).forEach(([key,value])=>localStorage.setItem(key,value))`)
      await productWindow.loadURL(backend.url)
    }
    try { await restore?.commit() }
    catch (cleanupError) { dialog.showErrorBox('旧数据暂未清理', '恢复已完成。旧数据暂存在数据目录旁的 .restore 目录，可关闭应用后清理。') }
    committed = true
    if (action !== 'configure') await dialog.showMessageBox(productWindow, { type: 'info', message: action === 'backup' ? '完整备份已导出' : '备份已恢复', detail: action === 'backup' ? file : '记录和配置已重新载入。' })
    return { ok: true }
  } catch (error) {
    if (stopped && !committed) {
      await backend?.stop(); backend = undefined
      await restore?.rollback()
      if (credentials) await writeFile(settingsFile, credentials)
      else await rm(settingsFile, { force: true })
      settings = previousSettings
      if (!quitting) {
        try { await launchProduct() }
        catch (restartError) { dialog.showErrorBox('工作台重启失败', '数据已保留，请重新打开桌面应用。') }
      }
    }
    dialog.showErrorBox('操作未完成', error.message)
    return { error: error.message }
  }
}
function checkedPreferences(value) {
  const result = {}
  for (const key of ['qiuzhao-appearance-v1', 'qiuzhao-theme']) {
    if (typeof value?.[key] === 'string' && value[key].length < 1000) result[key] = value[key]
  }
  return result
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
  if (!productWindow) {
  productWindow = new BrowserWindow({ width: 1440, height: 940, minWidth: 880, minHeight: 620, show: false,
    title: '校招高手 × 拾知面试陪练', backgroundColor: '#f3f6f7',
    webPreferences: { preload: join(source, 'product-preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } })
  productWindow.webContents.setWindowOpenHandler(({ url }) => { openExternal(url); return { action: 'deny' } })
  productWindow.webContents.on('will-navigate', (event, url) => { if (!trustedUrl(url)) { event.preventDefault(); openExternal(url) } })
  productWindow.webContents.on('will-frame-navigate', (event) => { if (!trustedUrl(event.url)) event.preventDefault() })
  productWindow.webContents.on('will-attach-webview', (event) => event.preventDefault())
  productWindow.on('page-title-updated', (event) => event.preventDefault())
  productWindow.on('close', (event) => { if (!canQuit) { event.preventDefault(); app.quit() } })
  productWindow.on('closed', () => { productWindow = undefined })
  }
  await productWindow.loadURL(backend.url)
  productWindow.show()
}
