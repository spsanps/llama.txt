// No need to require 'electron', use the exposed electronAPI from preload.js

// 
// -------------------------------- Quill -------------------------------- //
var quill; // Declare it globally
let randomTextLength = 0; // Track length of the random text
let randomTextStart = 0; // Track the start position of the random text

let currentSuggestionLength = 10; // Track length of the current suggestion

document.addEventListener('DOMContentLoaded', function () {
  quill = new Quill('#textEditor', {
    modules: { toolbar: '#toolbar' },
    theme: 'snow'
  });

  quill.on('text-change', function (delta, oldDelta, source) {
    if (source === 'user') {
      // if the last editor activity was a tab, remove it
      // use delta.ops to check if the last operation was a tab
      console.log(delta.ops);
      if (delta.ops[delta.ops.length - 1].insert === '\t') {
        quill.deleteText(quill.getLength() - 1 - currentSuggestionLength, 1);
      }
      else {
        replaceRandomText();
      }
    }
  });

  // Listen for the Tab keydown event
  quill.root.addEventListener('keydown', function (event) {
    if (event.key === 'Tab') {
      // Prevent the default tab behaviour
      event.preventDefault();

      // Convert the random text to regular text
      convertRandomTextToRegular();
    }
  }
  );
});

function replaceRandomText() {
  const randomText = generateRandomString(10);
  const currentText = quill.getText();
  randomTextStart = currentText.length - 1 - randomTextLength;

  // Delete the previous random text
  // -1 for tab character
  quill.deleteText(randomTextStart, randomTextLength);

  // Insert new random text
  quill.insertText(randomTextStart, randomText + " ...", { color: 'rgba(0, 0, 0, 0.5)', italic: true });
  randomTextLength = randomText.length + 4; // Update length (+4 accounts for additional characters added)
}

function convertRandomTextToRegular() {
  const currentText = quill.slice(randomTextStart, randomTextStart + randomTextLength);
  // convert to regular text
  // ie remove italic and color
  console.log(randomText);


  // Replace the random text with regular text
  quill.deleteText(randomTextStart, randomTextLength);
  quill.insertText(randomTextStart, randomText, 'user');
  quill.removeFormat(randomTextStart, randomTextLength);
  randomTextLength = 0; // Reset the random text length
}

function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

// ------------------------------ Autocomplete ------------------------------ //

// llama.txt autocomplete interface
let suggestionLengthMax = 0; // Track length of the current suggestion
let suggestionContextLengthMax = 100; // Number of words to include in the context
let suggestionContextLengthMin = 10; // Context should be refreshed when the number of words in the editor is less than this
// Track approximately number of words in the cache, in LLMs it's actually number of tokens but we will make do with words
let suggestionContextInCache = "";
let currentSuggestion = ""; // Track the current suggestion

// helper functions to count words
function countWords(str) {
  return str.trim().split(/\s+/).length;
}

// helper function to get the last n words
// but exactly as they are in the string
// ie. "this     is a string" with n = 4
// should return "this     is a string"
// and not "this is a string"
function getLastNWords(str, n) {
  // Regular expression to match the last n words
  const regex = new RegExp(`(?:\\s*\\S+){0,${n}}$`);

  // Apply the regex and return the match
  const match = str.match(regex);
  return match ? match[0] : '';
}
// when not active, request suggestions from the main process
// request suggestions from the main process
function requestSuggestions() {
  // Send the last n words to the main process
  window.electronAPI.requestSuggestions(lastNWords);
}

function checkContextisCorrect() {
  // Get the last n words from the editor
  // first we will get a string of 10*(n words) characters
  // then we will get the last n words from that string
  // if quill exists
  if (quill) {
    characterRequest = quill.getText(quill.getLength() - 10 * suggestionContextLength, 10 * suggestionContextLength);
    lastNWords = getLastNWords(characterRequest, suggestionContextLength);
    // give suggestions only if the context is correct
    if (lastNWords === suggestionContextInCache) {
      return true;
    }
  }
  return false;
}

// length of matching context
// Like above but instead of true or false, returns the length of the matching context
// this time words are not needed
function getMatchingContextLength() {
  // Get the last n words from the editor
  // first we will get a string of 10*(n words) characters
  // no words are needed
  if (quill) {
    sliceLength = 10 * suggestionContextLength; // approximate length of the slice estimated from the number of words

    characterRequest = quill.getText(quill.getLength() - sliceLength, sliceLength);
    // count backwards from the end of the string
    // until we find a mismatch
    // then return the number of characters from the end
    // ie. the length of the matching context
    let count = 0;
    for (let i = sliceLength - 1; i >= 0; i--) {
      if (characterRequest[i] !== suggestionContextInCache[i]) {
        break;
      }
      count++;
    }
    return count;
  }
  return 0;
}
// function to handle incoming suggestions
function handleSuggestion(suggestion) {
  // should update suggestionContext
  currentSuggestion = suggestion;
}

function getFirstWord(str) {
  // this will include space before and after the word
  // need to include both
  let i = 0;
  // run till first non-space character
  // space includes \n \t \r etc
  // use regex to match space
  // not implemented
  throw new Error("Not implemented");
}


// function to handle accepting a word
// should call the ui update function
// also should update the suggestionContext
function acceptFirstWordUi() {
  // get the first word from the suggestion
  // and insert it into the editor
  // then update the suggestion context
  // and update the suggestion length
  const firstWord = null; // implement this
  throw new Error("Not implemented");
}

// function to handle accepting a word
function acceptFirstWord() {

  // add check somewhere to see if suggestion is empty
  // Documentation: 
  // move one word from suggestion to context
  // remove the first word from the suggestion
  // add the first word to the end of the context
  // remove the first word from context
  // update currentSuggestionLength
  // update currentSuggestion by 
  // acceptFirstWordUi();
  // update accepted words (call the main process)
  // update
  // -----------------------------------------//
  // Code:
  throw new Error("Not implemented");
}

function acceptEntireSuggestion() {
  throw new Error("Not implemented");
}

// get a new suggestion
// update the suggestion and length

function updateSuggestion(suggest) {
  // update UI
  // update suggestion
  // update suggestion length
  throw new Error("Not implemented");
}

// updates when cursor is moved
// need to request context update
// if within a certain range
// we can update context accordingly
// we will not implement that for now
// let's just request context update fully
function onCursorMove() {
  // request context update
  // call the main process
  throw new Error("Not implemented");
}

// backspace handler
function backSpaceContextUpdate() {
  // if the last character is a back space
  // request context update
  // call the main process
  throw new Error("Not implemented");
}




  

// ------------------------------ Dark Mode ------------------------------ //
let isDarkMode = false;
let lastEditorActivity = Date.now();

document.getElementById('darkModeToggle').addEventListener('click', () => {
  isDarkMode = !isDarkMode; // Toggle the isDarkMode flag

  if (isDarkMode) {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  } else {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  }
});

// ------------------------------- Buttons -------------------------------- //

// Test button click handler
document.getElementById('testButton').addEventListener('click', () => {
  window.electronAPI.onTestButtonClick();
});

// Open Folder button click handler
document.getElementById('openFolderButton').addEventListener('click', () => {
  window.electronAPI.onOpenFolderButtonClick();
});

// Refresh button click handler
document.getElementById('refreshButton').addEventListener('click', () => {
  window.electronAPI.onRefreshButtonClick();
});

// Save button click handler
document.getElementById('saveButton').addEventListener('click', () => {
  window.electronAPI.onSaveButtonClick();
});

// ------------------------------- Editor ------------------------------- //

// Get editor content
window.electronAPI.getEditorContent((event) => {
  const content = quill.getText();
  window.electronAPI.responseGetEditorContent(content);
});

// Update editor content
window.electronAPI.updateEditorContent((event, content) => {
  quill.setText(content);
});

// Whenever the editor content changes, update the lastEditorActivity
document.getElementById('textEditor').addEventListener('input', () => {
  lastEditorActivity = Date.now();
  // write to id="lastEditorActivity"
  const lastEditorActivityElement = document.getElementById('lastEditorActivity');
  lastEditorActivityElement.innerText = lastEditorActivity;
});

// ---------------------------- Update File List --------------------------- //

function createFileCard(fileName) {
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body section-card';

  cardBody.addEventListener('click', () => {
    window.electronAPI.requestOpenFile(fileName);
    // Make the card active (if already active leave it)
    const activeCard = document.querySelector('.card.active');
    if (!activeCard) {
      cardBody.classList.add('active');
    }
    // make all other cards inactive (in div with id="fileList")
    const cards = document.querySelectorAll('#fileList .card');
    cards.forEach(card => {
      if (card !== cardBody) {
        card.classList.remove('active');
      }
    });
  });
  const cardText = document.createElement('p');
  cardText.className = 'card-text';
  cardText.textContent = fileName;
  cardBody.appendChild(cardText);

  return cardBody;
}

window.electronAPI.updateFileList((event, fileNames) => {
  const fileListElement = document.getElementById('fileList');
  fileListElement.innerHTML = ''; // Clear existing list

  fileNames.forEach(fileName => {
    const cardBody = createFileCard(fileName);
    fileListElement.appendChild(cardBody);
  });
});

