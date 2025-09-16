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
