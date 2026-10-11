const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('masterCloudDesktop', {
  getStatus: () => ipcRenderer.invoke('get-status'),
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  logout: () => ipcRenderer.invoke('logout'),
  openDrive: () => ipcRenderer.invoke('open-drive'),
  openWeb: () => ipcRenderer.invoke('open-web'),
  getWebSession: () => ipcRenderer.invoke('get-web-session'),
  setDriveLetter: (letter) => ipcRenderer.invoke('set-drive-letter', letter),
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  onStatusChange: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('status-update', handler);
    return () => ipcRenderer.removeListener('status-update', handler);
  },
});
