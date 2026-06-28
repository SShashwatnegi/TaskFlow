// content.js
// This script runs on the TaskFlow web app and syncs the JWT token to the extension's local storage

function syncToken() {
  const token = localStorage.getItem('ss_token') || localStorage.getItem('token');
  chrome.storage.local.get(['token'], (result) => {
    if (token && result.token !== token) {
      chrome.storage.local.set({ token });
      console.log('[TaskFlow Extension] Token automatically synced!');
    } else if (!token && result.token) {
      chrome.storage.local.remove('token');
      console.log('[TaskFlow Extension] Token removed (user logged out).');
    }
  });
}

// Initial sync on load
syncToken();

// Check periodically in case the token is updated without a full page reload
setInterval(syncToken, 2000);

// Listen to storage events from other tabs
window.addEventListener('storage', (event) => {
  if (event.key === 'ss_token' || event.key === 'token') {
    syncToken();
  }
});
