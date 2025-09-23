// Core Module - Main functionality and history loading
let allWorks = [];
let filteredWorks = [];
let lastFailedAction = null;

// Pagination state
let currentDisplayCount = 20;

function showLoginError() {
  showFicTrailError('Oops! It looks like you\'ve been logged out of AO3. <a href="https://archiveofourown.org/users/login" target="_blank" rel="noopener" style="color: inherit; text-decoration: underline;">Log in to AO3</a> and then try again.');
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
    // Check if we're on page 1 of readings - if so, parse current DOM instantly
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page')) || 1;

    if (window.location.pathname.includes('/readings') && currentPage === 1 && !urlParams.has('show')) {
      const works = scrapeHistoryFromPage(document);
      const totalPages = getTotalPages(document);

      if (works && works.length > 0) {
        displayHistory(username, works, totalPages, 1);
        return;
      }
    }

    // Fallback: use reloadHistory to fetch first page
    await reloadHistory();
  } catch (error) {
    if (error.message === 'NOT_LOGGED_IN') {
      showLoginError(ERROR_MESSAGES.LOGGED_OUT);
      return;
    }
    console.error('Error loading first page:', error);
    showFicTrailError(ERROR_MESSAGES.FETCH_FAILED);
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
  if (loadBtn) loadBtn.disabled = true;
  if (retryBtn) retryBtn.disabled = true;

  // Preserve search and filter values when reloading
  const searchInput = document.getElementById('fictrail-search-input');
  const fandomFilter = document.getElementById('fictrail-fandom-filter');
  const preservedSearchValue = searchInput ? searchInput.value : '';
  const preservedFandomValue = fandomFilter ? fandomFilter.value : '';

  // Get pages to load from slider
  const pagesToLoad = getPagesToLoad();

  showFicTrailLoading(`Loading ${pagesToLoad} ${pagesToLoad === 1 ? 'page' : 'pages'} of ${username}'s fic history...`);

  try {
    const result = await fetchMultiplePages(username, pagesToLoad);
    if (result.works && result.works.length > 0) {
      displayHistory(username, result.works, result.totalPages, pagesToLoad, preservedSearchValue, preservedFandomValue);
    } else {
      showFicTrailError(ERROR_MESSAGES.NO_DATA);
    }
  } catch (error) {
    if (error.message === 'NOT_LOGGED_IN') {
      showLoginError(ERROR_MESSAGES.LOGGED_OUT);
      return;
    }
    console.error('Error loading history:', error);
    showFicTrailError(ERROR_MESSAGES.FETCH_FAILED);
  } finally {
    // Re-enable buttons after loading completes
    const loadBtn = document.getElementById('fictrail-load-btn');
    const retryBtn = document.getElementById('fictrail-retry-btn');
    if (loadBtn) loadBtn.disabled = false;
    if (retryBtn) retryBtn.disabled = false;
  }
}

function displayHistory(username, works, totalPages, actualPagesLoaded, preservedSearchValue = '', preservedFandomValue = '') {
  showFicTrailResults();

  allWorks = works;
  filteredWorks = [...works];

  // Reset pagination when loading new history
  currentDisplayCount = ITEMS_PER_PAGE;

  const workCount = works.length;
  const uniqueAuthors = new Set(works.map(work => work.author)).size;
  const uniqueFandoms = new Set(works.flatMap(work => work.fandoms)).size;

  // Update individual subtitle elements with proper plural/singular forms
  const worksCountEl = document.getElementById('fictrail-works-count');
  const fandomsCountEl = document.getElementById('fictrail-fandoms-count');
  const authorsCountEl = document.getElementById('fictrail-authors-count');

  if (worksCountEl) worksCountEl.textContent = `${workCount} ${workCount === 1 ? 'work' : 'works'}`;
  if (fandomsCountEl) fandomsCountEl.textContent = `${uniqueFandoms} ${uniqueFandoms === 1 ? 'fandom' : 'fandoms'}`;
  if (authorsCountEl) authorsCountEl.textContent = `${uniqueAuthors} ${uniqueAuthors === 1 ? 'author' : 'authors'}`;

  // Update slider max value to match user's actual page count
  if (totalPages && totalPages > 0) {
    const slider = document.getElementById('fictrail-pages-slider');
    const sliderMax = document.querySelector('.fictrail-slider-max');
    const pagesLabel = document.getElementById('fictrail-pages-label');

    if (slider) slider.max = totalPages;
    if (sliderMax) sliderMax.textContent = totalPages;

    // Update the status text with actual page count and current loaded pages
    const pagesStatusText = document.getElementById('fictrail-pages-status-text');
    if (pagesStatusText) {
      if (actualPagesLoaded === totalPages) {
        pagesStatusText.textContent = `You have ${totalPages} ${totalPages === 1 ? 'page' : 'pages'} of history. All ${totalPages === 1 ? 'page' : 'pages'} loaded.`;
      } else {
        pagesStatusText.textContent = `You have ${totalPages} ${totalPages === 1 ? 'page' : 'pages'} of history. Now ${actualPagesLoaded} ${actualPagesLoaded === 1 ? 'page is' : 'pages are'} loaded. Shall we go deeper?`;
      }
    }

    // Set slider value to the actual pages loaded (for initial load) or keep current value (for reload)
    if (slider) {
      if (actualPagesLoaded !== undefined) {
        slider.value = actualPagesLoaded;
      } else {
        const newValue = Math.min(parseInt(slider.value), totalPages);
        slider.value = newValue;
      }
    }
  }

  // Show pages info with page selector and update button for reload functionality
  const pagesInfo = document.getElementById('fictrail-pages-info');
  const loadBtn = document.getElementById('fictrail-load-btn');
  if (pagesInfo) pagesInfo.style.display = 'block';
  if (loadBtn) {
    loadBtn.textContent = 'Reload History';
    loadBtn.onclick = reloadHistory;
  }
  updateReloadButtonText();

  // Add favorite tags summary
  addFavoriteTagsSummary(works);

  // Add search and display functionality
  populateFandomFilter(works);

  // Restore preserved search and filter values
  const searchInput = document.getElementById('fictrail-search-input');
  const fandomFilter = document.getElementById('fictrail-fandom-filter');

  if (searchInput && preservedSearchValue) {
    searchInput.value = preservedSearchValue;
  }

  if (fandomFilter && preservedFandomValue) {
    fandomFilter.value = preservedFandomValue;
  }

  // Apply search and filter if values were preserved
  if (preservedSearchValue || preservedFandomValue) {
    performSearch(); // This will also apply the filter
  } else {
    updateResultsCount(works.length);
    displayWorks(works);
  }

  console.log(`Loaded ${works.length} works from ${actualPagesLoaded} pages`);
}

// Initialize when page loads
function init() {
  addStyles();
  createFicTrailButton();
  // Don't create overlay until button is clicked
}

// Auto-initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
