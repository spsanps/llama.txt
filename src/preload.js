const { contextBridge, ipcRenderer } = require('electron');

// Naming conventions
// get- for requesting data from the renderer process
// request- for requesting the main process to do something / request data
// on- for listening to events in the renderer process
// update- for sending data to the renderer process to update UI
// response- for sending data to the main process in response to a request

// button interactions
const buttonAPIs = {
  onOpenFolderButtonClick: () => ipcRenderer.send('on-open-folder-button-click'),
  onRefreshButtonClick: () => ipcRenderer.send('on-refresh-button-click'),
  onSaveButtonClick: () => ipcRenderer.send('on-save-button-click'),
  onTestButtonClick: () => ipcRenderer.send('on-test-button-click'),
  // ... other button interactions
};

// editor interactions
const editorAPIs = {
  updateEditorContent: (callback) => ipcRenderer.on('update-editor-content', callback),
  // getEditorContent will be called from the main process as callback
  getEditorContent: (callback) => ipcRenderer.on('get-editor-content', callback),
  // responseGetEditorContent will be called from the renderer process
  responseGetEditorContent: (content) => ipcRenderer.send('response-get-editor-content', content),
};

// file list interactions
const fileListAPIs = {
  updateFileList: (callback) => ipcRenderer.on('update-file-list', callback),
  requestOpenFile: (fileName) => ipcRenderer.send('request-open-file', fileName),
  // ... other list file interactions
};

// Settings and preferences
const settingsAPI = {
  // ... settings related functions
};

// Combine all APIs
const electronAPI = {
  ...buttonAPIs,
  ...settingsAPI,
  ...editorAPIs,
  ...fileListAPIs,
  // ... other APIs
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
