const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startService: (serviceName) => ipcRenderer.invoke('service:start', serviceName),
  stopService: (serviceName) => ipcRenderer.invoke('service:stop', serviceName),
  forceStop: (serviceName) => ipcRenderer.invoke('service:forceStop', serviceName),
  getServiceStatus: (serviceName) => ipcRenderer.invoke('service:status', serviceName),
  getAllStatus: () => ipcRenderer.invoke('service:statusAll'),
  clearLogs: (serviceName) => ipcRenderer.invoke('service:clearLogs', serviceName),
  checkPort: (serviceName) => ipcRenderer.invoke('service:checkPort', serviceName),
  cleanupPort: (port) => ipcRenderer.invoke('service:cleanupPort', port),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  resetSettings: () => ipcRenderer.invoke('settings:reset'),
  browseFolder: () => ipcRenderer.invoke('settings:browseFolder'),
  runRagUtility: (command) => ipcRenderer.invoke('rag:utility', command),
  
  onLog: (callback) => {
    ipcRenderer.on('service:log', (event, data) => callback(data));
  },
  
  onStatusChange: (callback) => {
    ipcRenderer.on('service:status-change', (event, data) => callback(data));
  }
});
