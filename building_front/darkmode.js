function toggleDarkMode() {
    var bodyElement = document.body;
    if (bodyElement.classList.contains('dark-theme')) {
        bodyElement.classList.remove('dark-theme');
        bodyElement.classList.add('light-theme');
    } else {
        bodyElement.classList.remove('light-theme');
        bodyElement.classList.add('dark-theme');
    }
}
