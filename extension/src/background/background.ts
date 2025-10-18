// Background service worker for the extension

// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    // Open the side panel when extension icon is clicked
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Log when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Math Wizards extension installed!');
});

// Handle messages from content scripts or sidebar
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  // You can add message handling logic here as needed

  return true;
});
