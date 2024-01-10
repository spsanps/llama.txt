const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('electronAPI', {
  toggleDarkMode: () => ipcRenderer.send('toggle-dark-mode'),
  onDarkModeStatus: (callback) => ipcRenderer.on('dark-mode-status', callback),
  openFolder: () => ipcRenderer.send('open-folder'),
  onFolderOpened: (callback) => ipcRenderer.on('folder-opened', callback),
  refreshFileList: () => ipcRenderer.send('refresh-file-list'),
  openFile: (filePath) => ipcRenderer.send('open-file', filePath),
  onFileContent: (callback) => ipcRenderer.on('file-content', callback),
  saveFile: (content) => ipcRenderer.send('save-file', content),
});
