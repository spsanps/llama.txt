const fs = require('fs');
const path = require('path');
const util = require('util');


// Promisify the fs.readFile and fs.writeFile for use with async/await
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const readdirAsync = util.promisify(fs.readdir);

const fileOperations = {
  // Read a file's content
  async readFile(filePath) {
    try {
      const content = await readFileAsync(filePath, 'utf8');
      return content;
    } catch (err) {
      console.error('Error reading file:', err);
      throw err; // Rethrow the error for handling in the caller
    }
  },

  // Write content to a file
  async writeFile(filePath, content) {
    try {
      await writeFileAsync(filePath, content, 'utf8');
    } catch (err) {
      console.error('Error writing file:', err);
      throw err;
    }
  },

  // List files in a directory
  async listFiles(directoryPath) {
    try {
      const files = await readdirAsync(directoryPath);
      return files.map(file => path.basename(file));
    } catch (err) {
      console.error('Error listing files:', err);
      throw err;
    }
  },
};

module.exports = fileOperations;
