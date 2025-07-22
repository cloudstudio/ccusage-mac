const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getInitialUsage: () => ipcRenderer.invoke('get-initial-usage'),
    onUpdateUsage: (callback) => ipcRenderer.on('update-usage', (event, ...args) => callback(...args)),
    setPeriod: (period) => ipcRenderer.send('set-period', period),
    refreshUsage: () => ipcRenderer.send('refresh-usage')
});
