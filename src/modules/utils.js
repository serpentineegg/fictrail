// Utils Module - Helper functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Check if we're on AO3 and user is logged in
function getUsername() {
  const greetingLink = document.querySelector('#greeting .user a[href*="/users/"]');
  if (greetingLink) {
    const href = greetingLink.getAttribute('href');
    const match = href.match(/\/users\/([^/]+)/);
    return match ? match[1] : null;
  }
  return null;
}

// Detect logged-out state based on AO3 login indicators within a fetched Document
function isLoggedOutDoc(doc) {
  const loginLink = doc.querySelector('a[href*="/users/login"]');
  const loggedOutMessage = doc.querySelector('.flash.notice');
  return Boolean(loginLink || (loggedOutMessage && loggedOutMessage.textContent.includes('log in')));
}
