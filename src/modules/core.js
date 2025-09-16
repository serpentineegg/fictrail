// Core Module - Main functionality and history loading
let allWorks = [];
let filteredWorks = [];

async function loadHistory() {
  const username = getUsername();
  if (!username) {
    showError('<strong>Oops! You\'re not logged in</strong><br>Please sign into your AO3 account first. We need access to your history!');
    return;
  }

  // Disable buttons while loading
  const loadBtn = document.getElementById('fictrail-load-btn');
  const retryBtn = document.getElementById('fictrail-retry-btn');
  loadBtn.disabled = true;
  if (retryBtn) retryBtn.disabled = true;

  // Clear search bar when reloading
  document.getElementById('fictrail-search-input').value = '';

  // Get pages to load from slider, default to 10 for initial load
  const isReload = loadBtn.textContent.includes('Reload History');
  let pagesToLoad;

  if (isReload) {
    pagesToLoad = getPagesToLoad();
  } else {
    // For initial load, first get total pages to set appropriate default
    showLoading('Checking your history...');

    try {
      const firstPageUrl = `${AO3_BASE_URL}/users/${username}/readings?page=1`;
      const response = await fetch(firstPageUrl);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const totalPages = getTotalPages(doc);

      // Update slider max value and set appropriate default
      const slider = document.getElementById('fictrail-pages-slider');
      const sliderMax = document.querySelector('.fictrail-slider-max');
      slider.max = totalPages;
      sliderMax.textContent = totalPages;

      pagesToLoad = Math.min(10, totalPages);
      slider.value = pagesToLoad;
    } catch (error) {
      console.error('Error getting total pages:', error);
      pagesToLoad = 10; // fallback
    }
  }

  showLoading(`Loading ${pagesToLoad} pages of ${username}'s history...`);

  try {
    const result = await fetchMultiplePages(username, pagesToLoad);
    if (result.works && result.works.length > 0) {
      displayHistory(username, result.works, result.totalPages, pagesToLoad);
    } else {
      showError('Hmm, we didn\'t get any fic data back. Want to try that again?');
    }
  } catch (error) {
    console.error('Error loading history:', error);
    showError('Uh oh! Something went wrong while fetching your reading adventures. Let\'s try again?');
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
    slider.max = totalPages;
    sliderMax.textContent = totalPages;

    // Set slider value to the actual pages loaded (for initial load) or keep current value (for reload)
    if (actualPagesLoaded !== undefined) {
      slider.value = actualPagesLoaded;
    } else {
      const newValue = Math.min(parseInt(slider.value), totalPages);
      slider.value = newValue;
    }
  }

  // Update button text to indicate reload and show page selector
  const pageSelector = document.getElementById('fictrail-page-selector');
  pageSelector.style.display = 'flex';
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
