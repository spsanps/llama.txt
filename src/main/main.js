const {
  app,
  BrowserWindow,
  ipcMain,
  dialog
} = require('electron');
const path = require('path');
const fileOps = require('./fileOperations');
const editorInterface = require('./editorInterface');
const { performance } = require('perf_hooks'); // This is used to measure time


let mainWindow;
let activeDir = null; // Variable to store the last opened directory path
let activeFilePath = null; // Variable to store the active file path

//cpp stuff
const addon = require('../cpp-core/build/Release/addon');


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    icon: path.join(__dirname, '../../assets/icons/round/64x64.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../../web/index.html'));
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

// ------------------------------ Helpers ------------------------------ //
// TODO: add wrappers in their corresponding files

// wrapper for listFiles with dialog box if error can be used with await
async function listFilesWithErrorHandler(dir) {
  try {
    const fileNames = await fileOps.listFiles(dir);
    return fileNames;
  } catch (error) {
    // Handle the error
    console.error('Error listing files:', error);

    // Show an error dialog box to the user
    dialog.showErrorBox('Error', 'An error occurred while listing the files.');
  }
}

// wrapper for fileOps.readFile with dialog box if error can be used with await
async function readFileWithErrorHandler(filePath) {
  try {
    const content = await fileOps.readFile(filePath);
    return content;
  } catch (error) {
    // Handle the error
    console.error('Error reading file:', error);

    // Show an error dialog box to the user
    dialog.showErrorBox('Error', 'An error occurred while reading the file.');
  }
}


// ------------------------------ Buttons ------------------------------ //

// Test button click handler
ipcMain.on('on-test-button-click', (event) => {
  // Define two numbers to add
  const number1 = 5;
  const number2 = 10;

  // Start the timer
  let startTime = performance.now();
  
  // Call the add function from the C++ addon with two numbers
  let result;
  try {
    result = addon.add(number1, number2);
  } catch (error) {
    console.error('Error calling addon function:', error);
    event.reply('computation-failed', error.message);
    return;
  }
  
  // End the timer
  let endTime = performance.now();
  
  // Calculate the time taken
  let timeTaken = endTime - startTime;

  // Log the result and the time taken
  console.log(`Result of addition: ${result}`);
  console.log(`Time taken for addition: ${timeTaken} milliseconds`);
  
  // Optionally, send the result and time back to the renderer process
  event.reply('addition-result', { result, timeTaken });
});

// Open Folder button click handler
ipcMain.on('on-open-folder-button-click', async (event) => {
  if (activeFilePath) {
    await editorInterface.saveIfActiveWithErrorDialog(mainWindow, activeFilePath);
  }
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (canceled || filePaths.length === 0) {
    return;
  }

  activeDir = filePaths[0]; // Store the directory path
  activeFilePath = null; // Reset the active file path
  // update editor content
  editorInterface.updateEditorContent(mainWindow, '');
  // update file list
  const fileNames = await listFilesWithErrorHandler(activeDir);
  mainWindow.webContents.send('update-file-list', fileNames);
});

// Refresh button click handler
ipcMain.on('on-refresh-button-click', async (event) => {
  if (!activeDir) {
    return;
  }
  const fileNames = await listFilesWithErrorHandler(activeDir);
  mainWindow.webContents.send('update-file-list', fileNames);
});

// Save button click handler
ipcMain.on('on-save-button-click', async (event) => {
  if (!activeFilePath) {
    return;
  }
  await editorInterface.saveIfActiveWithErrorDialog(mainWindow, activeFilePath);
  console.log("saved active file")
});

// ----------------------------- File Handlers ----------------------------- //
// Request open file handler
ipcMain.on('request-open-file', async (event, fileName) => {
  if (activeFilePath) {
    console.log('active file path', activeFilePath);

    await editorInterface.saveIfActiveWithErrorDialog(mainWindow, activeFilePath);
    console.log("saved active file")
  }

  activeFilePath = path.join(activeDir, fileName);

  console.log(activeFilePath);

  const content = await readFileWithErrorHandler(activeFilePath);
  editorInterface.updateEditorContent(mainWindow, content);
});

