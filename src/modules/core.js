// Core Module - Main functionality and history loading
let allWorks = [];
let filteredWorks = [];
let lastFailedAction = null;

function showLoginError(message = ERROR_MESSAGES.LOGIN_REQUIRED) {
  showError(`
    <strong>Oops! You're not logged in</strong><br>
    ${message}<br><br>
    <button onclick="window.open('https://archiveofourown.org/users/login', '_blank')" class="fictrail-btn">
      Log In to AO3
    </button>
  `);
}

function retryLastAction() {
  if (lastFailedAction === 'reloadHistory') {
    reloadHistory();
  } else {
    loadFirstPage();
  }
}

async function loadFirstPage() {
  lastFailedAction = 'loadFirstPage';
  const username = getUsername();
  if (!username) {
    showLoginError();
    return;
  }

  try {
    // Check if we're already on the readings page - if so, parse current DOM instantly
    if (window.location.pathname.includes('/readings')) {
      const works = scrapeHistoryFromPage(document);
      const totalPages = getTotalPages(document);

      if (works && works.length > 0) {
        displayHistory(username, works, totalPages, 1);
        return;
      }
    }

    // Fallback: fetch first page if DOM parsing failed or we're not on readings page
    showLoading('Summoning your fic history...');
    const result = await fetchMultiplePages(username, 1);
    if (result.works && result.works.length > 0) {
      displayHistory(username, result.works, result.totalPages, 1);
    } else {
      showError(ERROR_MESSAGES.FETCH_FAILED);
    }
  } catch (error) {
    if (error.message === 'NOT_LOGGED_IN') {
      showLoginError(ERROR_MESSAGES.LOGGED_OUT);
      return;
    }
    console.error('Error loading first page:', error);
    showError(ERROR_MESSAGES.FETCH_FAILED);
  }
}

async function reloadHistory() {
  lastFailedAction = 'reloadHistory';
  const username = getUsername();
  if (!username) {
    showLoginError();
    return;
  }

  // Disable buttons while loading
  const loadBtn = document.getElementById('fictrail-load-btn');
  const retryBtn = document.getElementById('fictrail-retry-btn');
  loadBtn.disabled = true;
  if (retryBtn) retryBtn.disabled = true;

  // Clear search bar when reloading
  document.getElementById('fictrail-search-input').value = '';

  // Get pages to load from slider
  const pagesToLoad = getPagesToLoad();

  showLoading(`Loading ${pagesToLoad} pages of ${username}'s fic history...`);

  try {
    const result = await fetchMultiplePages(username, pagesToLoad);
    if (result.works && result.works.length > 0) {
      displayHistory(username, result.works, result.totalPages, pagesToLoad);
    } else {
      showError(ERROR_MESSAGES.NO_DATA);
    }
  } catch (error) {
    if (error.message === 'NOT_LOGGED_IN') {
      showLoginError(ERROR_MESSAGES.LOGGED_OUT);
      return;
    }
    console.error('Error loading history:', error);
    showError(ERROR_MESSAGES.FETCH_FAILED);
  } finally {
    // Re-enable buttons after loading completes
    const loadBtn = document.getElementById('fictrail-load-btn');
    const retryBtn = document.getElementById('fictrail-retry-btn');
    loadBtn.disabled = false;
    if (retryBtn) retryBtn.disabled = false;
  }
}

function displayHistory(username, works, totalPages, actualPagesLoaded) {
  showSection('fictrail-history-section');

  allWorks = works;
  filteredWorks = [...works];

  const workCount = works.length;
  const uniqueAuthors = new Set(works.map(work => work.author)).size;
  const uniqueFandoms = new Set(works.flatMap(work => work.fandoms)).size;

  document.getElementById('fictrail-subtitle').textContent =
          `${username} • ${workCount} works • ${uniqueFandoms} fandoms • ${uniqueAuthors} authors`;

  // Update slider max value to match user's actual page count
  if (totalPages && totalPages > 0) {
    const slider = document.getElementById('fictrail-pages-slider');
    const sliderMax = document.querySelector('.fictrail-slider-max');
    const pagesLabel = document.getElementById('fictrail-pages-label');

    slider.max = totalPages;
    sliderMax.textContent = totalPages;

    // Update the label with actual page count and current loaded pages
    if (actualPagesLoaded === totalPages) {
      pagesLabel.textContent = `You have ${totalPages} pages of history. All pages loaded.`;
    } else {
      pagesLabel.textContent = `You have ${totalPages} pages of history. Now ${actualPagesLoaded} ${actualPagesLoaded === 1 ? 'page is' : 'pages are'} loaded. Shall we go deeper?`;
    }

    // Set slider value to the actual pages loaded (for initial load) or keep current value (for reload)
    if (actualPagesLoaded !== undefined) {
      slider.value = actualPagesLoaded;
    } else {
      const newValue = Math.min(parseInt(slider.value), totalPages);
      slider.value = newValue;
    }
  }

  // Show footer with page selector and update button for reload functionality
  const footer = document.getElementById('fictrail-footer');
  const loadBtn = document.getElementById('fictrail-load-btn');
  footer.style.display = 'block';
  loadBtn.textContent = 'Reload History';
  loadBtn.onclick = reloadHistory;
  updateReloadButtonText();

  // Add favorite tags summary
  addFavoriteTagsSummary(works);

  populateFandomFilter(works);
  displayWorks(works);
}

// Initialize when page loads
function init() {
  addStyles();
  createFicTrailButton();
  createOverlay();
}

// Auto-initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
