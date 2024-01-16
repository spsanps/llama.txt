const { ipcMain } = require('electron');
const fileOps = require('./fileOperations');
// include dialog box
const { dialog } = require('electron');

let activeFilePath = null; // Assuming this is managed somewhere in your main process

const editorInterface = {
    getEditorContent(win) {
        return new Promise((resolve, reject) => {
            win.webContents.send('get-editor-content');

            ipcMain.once('response-get-editor-content', (event, content) => {
                resolve(content);
            });

            // Optional: set a timeout for the response
            setTimeout(() => {
                reject(new Error('Timeout waiting for editor content'));
            }, 5000); // 5 seconds timeout
        });
    },

    // save file if active
    saveIfActive(win, activeFilePath) {
        return new Promise((resolve, reject) => {
            if (!activeFilePath) {
                resolve(); // Nothing to save
                return;
            }

            this.getEditorContent(win)
                .then(content => fileOps.writeFile(activeFilePath, content))
                .then(() => resolve())
                .catch(error => {
                    console.error('Error in saving file:', error);
                    reject(error);
                });
        });
    },

    // save with error dialog (Wrapper for saveIfActive)
    saveIfActiveWithErrorDialog(win, activeFilePath) {
        return new Promise((resolve, reject) => {
            this.saveIfActive(win, activeFilePath)
                .then(() => resolve())
                .catch(error => {
                    // Handle the error
                    console.error('Error saving file:', error);

                    // Show an error dialog box to the user
                    dialog.showErrorBox('Error', 'An error occurred while saving the file.');
                    resolve(); // Resolve the promise to continue
                    // reject(error);
                });
        });
    },
    

    // update editor content
    updateEditorContent(win, content) {
        win.webContents.send('update-editor-content', content);
    },

    
    


    // ... Other editor-related functions
};

module.exports = editorInterface;
