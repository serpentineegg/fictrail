// Background script - runs when extension loads

// Listen for when extension icon is clicked
chrome.action.onClicked.addListener((_tab) => {

  // Open the history viewer page
  chrome.tabs.create({
    url: chrome.runtime.getURL('history.html'),
    active: true
  });
});
