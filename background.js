// Background script - runs when extension loads

// Listen for when extension icon is clicked
browser.browserAction.onClicked.addListener((tab) => {

  // Open the history viewer page
  browser.tabs.create({
    url: browser.runtime.getURL('history.html'),
    active: true
  });
});
