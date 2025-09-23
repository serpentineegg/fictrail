// Core Module - Main functionality and history loading
let allWorks = [];
let filteredWorks = [];

// Pagination state
let currentDisplayCount = 20;

function showLoginError() {
  showFicTrailError('Oops! It looks like you\'ve been logged out of AO3. <a href="https://archiveofourown.org/users/login" target="_blank" rel="noopener" style="color: inherit; text-decoration: underline;">Log in to AO3</a> and then try again.');
}

async function reloadHistory() {
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

  const pagesToLoad = getPagesToLoad();

  // Check if we can use cached data
  if (isCacheValid() && getMaxCachedPage() >= pagesToLoad) {
    console.log(`Using cached data for ${pagesToLoad} pages`);
    showFicTrailLoading('Loading from cache...');

    // Combine cached pages up to the requested amount
    const works = [];
    for (let page = 1; page <= pagesToLoad; page++) {
      if (pageCache.has(page)) {
        works.push(...pageCache.get(page).works);
      }
    }

    displayHistory(username, works, cachedTotalPages, pagesToLoad, preservedSearchValue, preservedFandomValue);

    // Re-enable buttons
    if (loadBtn) loadBtn.disabled = false;
    if (retryBtn) retryBtn.disabled = false;
    return;
  }

  try {
    showFicTrailLoading(`Loading ${pagesToLoad} ${pagesToLoad === 1 ? 'page' : 'pages'} of ${username}'s fic history...`);
    const result = await fetchMultiplePagesWithCache(username, pagesToLoad);

    if (result.works && result.works.length > 0) {
      displayHistory(username, result.works, result.totalPages, Math.min(pagesToLoad, result.totalPages), preservedSearchValue, preservedFandomValue);
    } else {
      showFicTrailError(ERROR_MESSAGES.NO_DATA);
    }
  } catch (error) {
    if (error.message === 'NOT_LOGGED_IN') {
      showLoginError();
      return;
    }
    console.error('Error loading history:', error);
    showFicTrailError(ERROR_MESSAGES.FETCH_FAILED);
  } finally {
    // Re-enable buttons after loading completes
    if (loadBtn) loadBtn.disabled = false;
    if (retryBtn) retryBtn.disabled = false;
  }
}

function displayHistory(username, works, totalPages, actualPagesLoaded, preservedSearchValue = '', preservedFandomValue = '') {
  showFicTrailResults();

  allWorks = works;
  filteredWorks = [...works];
  currentDisplayCount = ITEMS_PER_PAGE;

  const workCount = works.length;
  const uniqueAuthors = new Set(works.map(work => work.author)).size;
  const uniqueFandoms = new Set(works.flatMap(work => work.fandoms)).size;

  // Update subtitle with cache status
  const worksCountEl = document.getElementById('fictrail-works-count');
  const fandomsCountEl = document.getElementById('fictrail-fandoms-count');
  const authorsCountEl = document.getElementById('fictrail-authors-count');

  if (worksCountEl) worksCountEl.textContent = `${workCount} ${workCount === 1 ? 'work' : 'works'}`;
  if (fandomsCountEl) fandomsCountEl.textContent = `${uniqueFandoms} ${uniqueFandoms === 1 ? 'fandom' : 'fandoms'}`;
  if (authorsCountEl) authorsCountEl.textContent = `${uniqueAuthors} ${uniqueAuthors === 1 ? 'author' : 'authors'}`;

  // Update slider and pages info
  if (totalPages && totalPages > 0) {
    const slider = document.getElementById('fictrail-pages-slider');
    const sliderMax = document.querySelector('.fictrail-slider-max');

    if (slider) slider.max = totalPages;
    if (sliderMax) sliderMax.textContent = totalPages;

    if (slider) {
      if (actualPagesLoaded !== undefined) {
        slider.value = actualPagesLoaded;
      } else {
        slider.value = Math.min(parseInt(slider.value), totalPages);
      }
    }

    // Update toggle text with cache information
    const cachedPageCount = getCachedPageCount();
    const toggleText = document.getElementById('fictrail-toggle-text');
    if (toggleText) {
      toggleText.textContent = `History Pages Loaded (${actualPagesLoaded}/${totalPages})`;
    }
  }

  // Show pages info and update button
  const pagesInfo = document.getElementById('fictrail-pages-info');
  const loadBtn = document.getElementById('fictrail-load-btn');
  if (pagesInfo) pagesInfo.style.display = 'block';
  if (loadBtn) {
    loadBtn.textContent = 'Reload History';
    loadBtn.onclick = reloadHistory;
  }
  updateReloadButtonText();

  addFavoriteTagsSummary(works);
  populateFandomFilter(works);

  // Restore preserved values and apply search/filter
  const searchInput = document.getElementById('fictrail-search-input');
  const fandomFilter = document.getElementById('fictrail-fandom-filter');

  if (searchInput && preservedSearchValue) {
    searchInput.value = preservedSearchValue;
  }
  if (fandomFilter && preservedFandomValue) {
    fandomFilter.value = preservedFandomValue;
  }

  if (preservedSearchValue || preservedFandomValue) {
    performSearch();
  } else {
    updateResultsCount(works.length);
    displayWorks(works);
  }

  console.log(`Loaded ${works.length} works from ${actualPagesLoaded} pages (${getCachedPageCount()} pages cached)`);
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

// --- Cache management BEGIN ---

const pageCache = new Map(); // Map of page numbers to {works: [], timestamp: number}
let cachedTotalPages = null;
let cacheTimestamp = null;

function isCacheValid() {
  return cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_EXPIRY_MS;
}

function clearCache() {
  pageCache.clear();
  cachedTotalPages = null;
  cacheTimestamp = null;
  console.log('Cache cleared');
}

function getCachedPageCount() {
  return pageCache.size;
}

function getMaxCachedPage() {
  if (pageCache.size === 0) return 0;
  return Math.max(...pageCache.keys());
}

// --- Cache management END ---
