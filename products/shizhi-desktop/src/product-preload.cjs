/** Only the product's main frame receives these fixed, path-free desktop operations. */
const { contextBridge, ipcRenderer } = require('electron')
if (process.isMainFrame) contextBridge.exposeInMainWorld('shizhiDesktop', {
  status: () => ipcRenderer.invoke('product:status'),
  configure: (input) => ipcRenderer.invoke('product:configure', input),
  backup: (input) => ipcRenderer.invoke('product:backup', input),
  restore: (input) => ipcRenderer.invoke('product:restore', input),
  openData: () => ipcRenderer.invoke('product:open-data'),
})
