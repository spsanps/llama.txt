// No need to require 'electron', use the exposed electronAPI from preload.js

document.getElementById('darkModeToggle').addEventListener('click', () => {
  window.electronAPI.toggleDarkMode();
});

document.getElementById('openFolderButton').addEventListener('click', () => {
  window.electronAPI.openFolder();
});

document.getElementById('refreshButton').addEventListener('click', () => {
  window.electronAPI.refreshFileList();
});

document.getElementById('saveButton').addEventListener('click', () => {
  /* send contents of text editor to main process */
  const editorElement = document.getElementById('textEditor');
  const content = editorElement.innerText;
  window.electronAPI.saveFile(content);
});
//
function createFileCard(dir, fileName) {
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body section-card';

  cardBody.addEventListener('click', () => {
    window.electronAPI.openFile(fileName);
    // Make the card active (if already active leave it)
    const activeCard = document.querySelector('.card.active');
    if (!activeCard) {
      cardBody.classList.add('active');
    }
  }
  );

  const cardText = document.createElement('p');
  cardText.className = 'card-text';
  cardText.textContent = fileName;
  cardBody.appendChild(cardText);

  return cardBody;
}

//

window.electronAPI.onFileContent((event, content) => {
  const editorElement = document.getElementById('textEditor');
  editorElement.innerText = content;
});

window.electronAPI.onDarkModeStatus((event, isDarkMode) => {
  if (isDarkMode) {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  } else {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  }
});

window.electronAPI.onFolderOpened((event, dir, fileNames) => {
  const fileListElement = document.getElementById('fileList');
  fileListElement.innerHTML = ''; // Clear existing list

  fileNames.forEach(fileName => {
    const cardBody = createFileCard(dir, fileName);
    fileListElement.appendChild(cardBody);
  });
});