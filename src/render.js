// No need to require 'electron', use the exposed electronAPI from preload.js

let editor = document.getElementById('textEditor');

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
  // get from id="textEditor"
  // const editor = document.getElementById('textEditor');
  const content = editor.innerText;

  window.electronAPI.responseGetEditorContent(content);
});

// Update editor content
window.electronAPI.updateEditorContent((event, content) => {
  // write to id="textEditor"
  // const editor = document.getElementById('textEditor');
  editor.innerText = content;
});

// Whenever the editor content changes, update the lastEditorActivity
editor.addEventListener('input', () => {
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

// ------------------------------ Autocomplete ------------------------------ //
// llama.txt autocomplete interface


let debounceTimer;
let debounceTime = 500;
let completionURL = "http://127.0.0.1:8080/completion";
let currentSuggestion = "";
let contextLengthChar = 10000;

function createSuggestionSpan(suggestion) {
  const span = document.createElement('span');
  span.className = 'suggestion';
  span.id = 'suggestion';
  span.textContent = suggestion;
  // contentEditable is set to false to prevent the span from being edited
  span.contentEditable = false;
  return span;
}

function insertTextAtCursor(text) {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    range.deleteContents(); // Delete any selected text
    range.insertNode(document.createTextNode(text));
    range.collapse(false); // Move the cursor to the end of the inserted text
  }
}

function insertSuggestionNodeAtCursor(node) {
  const sel = window.getSelection();

  if (sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    range.deleteContents(); // Delete any selected text
    range.insertNode(node);

    // To leave the cursor at the beginning of the inserted node, set the start (and end) of the range before the node
    range.setStartBefore(node);
    range.collapse(true); // Collapse the range to the start to move the cursor

    sel.removeAllRanges(); // Clear the selection
    sel.addRange(range); // Add the new range to move the cursor
  }
}

function generateRandomString(length) {
  // created for testing purposes
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

// Function to extract n characters leading up to the cursor position
function getNCharsBeforeCursor(n) {
  // const editor = document.getElementById('textEditor');
  let textUpToCursor = "";

  // Get the user's selection
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    // Get the range within the editor
    const range = selection.getRangeAt(0).cloneRange();
    if (range.commonAncestorContainer.parentNode === editor || range.commonAncestorContainer === editor) {
      // Set the range start to 0 or the difference between current position and n, whichever is greater
      const start = Math.max(range.startOffset - n, 0);
      range.setStart(range.startContainer, start);
      // Extract the text from the range
      textUpToCursor = range.toString().slice(-n);
    }
  }

  return textUpToCursor;
}

async function pingCompletionServer(promptText) {

  console.log("promptText", promptText);

  const data = {
    prompt: promptText
  };

  try {
    const response = await fetch(completionURL, {
      method: "POST", // Specify the request method
      headers: {
        "Content-Type": "application/json" // Specify the content type in the headers
      },
      body: JSON.stringify(data) // Convert the JavaScript object to a JSON string
    });

    if (!response.ok) {
      // Check if the response status code is not OK (200-299)
      throw new Error(`Request failed with status ${response.status}`);
    }

    const responseData = await response.json(); // Parse the JSON response body
    // console.log(responseData); // Log the response data to the console
    console.log("currentSuggestion", responseData);

    currentSuggestion = responseData.suggested;

  } catch (error) {
    console.error("Error:", error); // Log any errors to the console
    currentSuggestion = "";
  }
}

function updateSuggestionContent(newSuggestion) {
  // we will change the context inside the id="suggest" span if it exists
  // we will ensure the cursor is not moved

  const suggestion = document.getElementById('suggestion');
  if (suggestion) {
    suggestion.textContent = newSuggestion;
  }
}

async function updateSuggestion() {
  const context = getNCharsBeforeCursor(contextLengthChar);
  if (context.length > 0) {
    await pingCompletionServer(context);

    updateSuggestionContent(currentSuggestion);
  }
}


function deleteSuggestion() {
  const suggestion = document.getElementById('suggestion');
  if (suggestion) {
    suggestion.remove();
  }
}

function insertSuggestion() {
  const suggestionElement = createSuggestionSpan(currentSuggestion);
  insertSuggestionNodeAtCursor(suggestionElement);
}

// add event listener to the editor div for any kind of change
editor.addEventListener('input', function (event) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    deleteSuggestion();

    insertSuggestion();
    updateSuggestion();
  }, debounceTime); // Adjust debounce time as needed
});

// add event listener to the editor div for cursor movement
editor.addEventListener('click', function (event) {
  // first ensure selection is not inside the suggestion span
  // if it is move it out (left of the span)
  // moveCursorOutsideSuggestionToLeft();

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    deleteSuggestion();
    insertSuggestion();
    updateSuggestion();
  }, 500); // Adjust debounce time as needed
});

// accept suggestion on Tab key press
editor.addEventListener('keydown', function (event) {

  // moveCursorOutsideSuggestionToLeft();

  if (event.key === 'Tab') {
    event.preventDefault(); // Prevent the default tab behavior

    const suggestionElement = document.getElementById('suggestion');
    if (suggestionElement) {
      const suggestionText = suggestionElement.textContent;
      // Remove the suggestion element from the DOM
      suggestionElement.remove();

      if (event.shiftKey) {
        // Shift+Tab: Insert only the first "word" as per the defined pattern
        console.log("Shift+Tab");
        const match = suggestionText.match(/(^\s*\S+)/);

        if (match) {
          const firstWord = match[1]; // Extract the first word
          // console.log("firstWord", firstWord);
          const restOfSuggestion = suggestionText.substring(firstWord.length);

          insertTextAtCursor(firstWord); // Insert the first word and a space

          // If there's text remaining, recreate the suggestion span for it
          if (restOfSuggestion.trim().length > 0) {
            const newSuggestionElement = createSuggestionSpan(restOfSuggestion);
            insertSuggestionNodeAtCursor(newSuggestionElement);
          }
        }

      } else {
        // Tab: Integrate the entire suggestion and place the cursor at the end
        insertTextAtCursor(suggestionText);
      }
      updateSuggestion();
    }
  }
});
















