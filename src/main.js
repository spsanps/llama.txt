const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
let lastOpenedDir = null; // Variable to store the last opened directory path
let activeFilePath = null; // Variable to store the active file path



function sendFileList(event, dir) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error('Error reading directory', err);
      return;
    }

    const fileNames = files.map(file => path.basename(file)); // Send file names only
    event.sender.send('folder-opened', dir, fileNames); // Send directory path and file names
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../web/index.html'));

  ipcMain.on('toggle-dark-mode', () => {
    const isDarkMode = nativeTheme.shouldUseDarkColors;
    nativeTheme.themeSource = isDarkMode ? 'light' : 'dark';
    mainWindow.webContents.send('dark-mode-status', !isDarkMode);
  });


  ipcMain.on('open-folder', async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });

    if (canceled || filePaths.length === 0) {
      return;
    }

    lastOpenedDir = filePaths[0]; // Store the directory path
    sendFileList(event, lastOpenedDir);
  });

  ipcMain.on('refresh-file-list', (event) => {
    if (lastOpenedDir) {
      sendFileList(event, lastOpenedDir);
    }
  });

  ipcMain.on('open-file', (event, fileName) => {
    const filePath = path.join(lastOpenedDir, fileName);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file', err);
        return;
      }

      activeFilePath = filePath; // Update the active file path
      /* log the file content */
      console.log(data);
      event.sender.send('file-content', data);
    });
  });

  /* save file */
  ipcMain.on('save-file', (event, content) => {
    if (!activeFilePath) {
      return;
    }

    fs.writeFile(activeFilePath, content, (err) => {
      if (err) {
        console.error('Error writing file', err);
        return;
      }
    });
  });

}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
