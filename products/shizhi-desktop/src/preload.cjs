/** The local configuration page has a narrow, nonsecret IPC interface. */
const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('desktop', {
  status: () => ipcRenderer.invoke('desktop:status'),
  launch: (settings) => ipcRenderer.invoke('desktop:launch', settings),
})
