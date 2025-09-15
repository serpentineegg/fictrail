document.addEventListener('DOMContentLoaded', function () {
  // Constants
  const AO3_BASE_URL = 'https://archiveofourown.org';

  // DOM elements
  const loadBtn = document.getElementById('load-history-btn');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const errorMessage = document.getElementById('error-message');
  const navigateBtn = document.getElementById('navigate-btn');
  const retryBtn = document.getElementById('retry-btn');
  const historyContainer = document.getElementById('history-container');
  const headerSubtitle = document.getElementById('header-subtitle');
  const worksList = document.getElementById('works-list');
  const instructions = document.getElementById('instructions');
  const noResults = document.getElementById('no-results');

  // Search and filter elements
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const fandomFilter = document.getElementById('fandom-filter');

  // Page selector elements
  const pageSelector = document.getElementById('page-selector');
  const pagesSlider = document.getElementById('pages-slider');


  let allWorks = [];
  let filteredWorks = [];

  // Initialize event listeners
  loadBtn.addEventListener('click', loadHistory);
  retryBtn.addEventListener('click', loadHistory);
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('input', debounce(performSearch, 300));
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });
  fandomFilter.addEventListener('change', applyFilter);

  // Page selector event listeners
  pagesSlider.addEventListener('input', updatePagesValue);

  // Add event listener for clickable tags
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('clickable-tag')) {
      const tagValue = e.target.getAttribute('data-tag');
      if (tagValue) {
        searchInput.value = tagValue;
        performSearch();
        // Scroll to the search section
        document.querySelector('.history-controls').scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  });

  // Clear search input on page load
  searchInput.value = '';


  function updatePagesValue() {
    updateReloadButtonText();
  }

  function updateReloadButtonText() {
    const currentPages = parseInt(pagesSlider.value);
    // Check if we're in reload mode (history has been loaded)
    if (pageSelector.style.display !== 'none' && pageSelector.style.display !== '') {
      loadBtn.textContent = `Reload History (${currentPages} pages)`;
    }
  }


  function getPagesToLoad() {
    return parseInt(pagesSlider.value);
  }

  function showError(message, showNavigateBtn = false, navigateUrl = '', navigateText = 'Navigate') {
    hideAllSections();
    error.style.display = 'block';
    errorMessage.innerHTML = message;

    if (showNavigateBtn) {
      navigateBtn.textContent = navigateText;
      navigateBtn.style.display = 'inline-block';
      navigateBtn.onclick = () => {
        browser.tabs.create({url: navigateUrl});
      };
    } else {
      navigateBtn.style.display = 'none';
    }
  }

  function hideAllSections() {
    instructions.style.display = 'none';
    loading.style.display = 'none';
    error.style.display = 'none';
    historyContainer.style.display = 'none';
  }

  function showLoading(message = 'Summoning your fic history...') {
    hideAllSections();
    loading.style.display = 'block';
    document.getElementById('loading-status').textContent = message;
  }

  async function loadHistory() {
    // Clear search bar when reloading
    searchInput.value = '';

    showLoading('Hunting for your AO3 tabs...');
    loadBtn.style.display = 'none';

    try {
      // Find all AO3 tabs
      const ao3Tabs = await new Promise((resolve) => {
        browser.tabs.query({url: `*://${AO3_BASE_URL.replace('https://', '')}/*`}, resolve);
      });

      if (!ao3Tabs || ao3Tabs.length === 0) {
        showError(
          '<strong>Houston, we have a problem!</strong><br>No AO3 tabs detected. You need to have AO3 open in another tab first.',
          true,
          AO3_BASE_URL,
          'Take Me to AO3'
        );
        loadBtn.style.display = 'inline-block';
        return;
      }

      showLoading('Checking login status...');

      // Check each tab for login status and use the first one with a logged-in user
      for (const tab of ao3Tabs) {
        try {
          showLoading(`Investigating tab: ${new URL(tab.url).pathname}...`);

          const response = await new Promise((resolve) => {
            browser.tabs.sendMessage(tab.id, {action: 'getUsername'}, (response) => {
              if (browser.runtime.lastError) {
                resolve({error: 'Unable to connect to tab'});
              } else {
                resolve(response || {error: 'No response'});
              }
            });
          });

          if (response.username) {
            // Found a logged-in user, load their history
            showLoading(`Found you! Loading ${response.username}'s history...`);
            await loadFromTab(tab, response.username);
            return;
          }
        } catch (error) {
          // Tab check failed, continue to next tab
          continue;
        }
      }

      // No logged-in users found
      showError(
        '<strong>Oops! You\'re not logged in</strong><br>Please sign into your AO3 account in one of your open tabs. We need access to your history!',
        true,
        `${AO3_BASE_URL}/users/login`,
        'Log Me In'
      );

    } catch (error) {
      console.error('Error during load history:', error);
      showError('Something went sideways while loading your fic history. Mind giving it another shot?');
      // Error occurred during loading
    } finally {
      loadBtn.style.display = 'inline-block';
    }
  }

  async function loadFromTab(tab, username) {
    // For initial load, get total pages first to determine appropriate default
    const isReload = loadBtn.textContent.includes('Reload History');
    let pagesToLoad;

    if (isReload) {
      pagesToLoad = getPagesToLoad();
    } else {
      // For initial load, first get total pages to set appropriate default
      showLoading('Checking your history...');

      try {
        const totalPagesResponse = await new Promise((resolve) => {
          browser.tabs.sendMessage(tab.id, {
            action: 'getTotalPages'
          }, (response) => {
            if (browser.runtime.lastError) {
              resolve({error: 'No response received'});
            } else {
              resolve(response || {error: 'No response received'});
            }
          });
        });

        if (totalPagesResponse.totalPages) {
          pagesToLoad = Math.min(10, totalPagesResponse.totalPages);
        } else {
          pagesToLoad = 10; // fallback
        }
      } catch (error) {
        console.error('Error getting total pages:', error);
        pagesToLoad = 10; // fallback
      }
    }

    const loadingMessage = `Collecting ${pagesToLoad} pages of ${username}'s history...`;

    showLoading(loadingMessage);

    try {
      const response = await new Promise((resolve) => {
        browser.tabs.sendMessage(tab.id, {
          action: 'getHistory',
          maxPages: pagesToLoad
        }, (response) => {
          if (browser.runtime.lastError) {
            console.error('Runtime error:', browser.runtime.lastError);
            resolve({error: 'No response received'});
          } else {
            resolve(response || {error: 'No response received'});
          }
        });
      });

      if (response.error) {
        showError(response.error);
      } else if (response.works) {
        displayHistory(response.username, response.works, response.totalWorks, response.totalPages, pagesToLoad);
      } else {
        showError('Hmm, we didn\'t get any fic data back. Want to try that again?');
      }
    } catch (error) {
      console.error('Error loading from tab:', error);
      showError('Uh oh! Something went wrong while fetching your reading adventures. Let\'s try again?');
    }
  }

  function displayHistory(username, works, totalWorks, totalPages, actualPagesLoaded) {
    hideAllSections();
    historyContainer.style.display = 'block';

    // Store works globally
    allWorks = works;
    filteredWorks = [...works];

    // Update header with username and all stats
    const workCount = totalWorks || works.length;
    const uniqueAuthors = new Set(works.map(work => work.author)).size;
    const uniqueFandoms = new Set(works.flatMap(work => work.fandoms)).size;

    headerSubtitle.textContent = `${username} • ${workCount} works • ${uniqueFandoms} fandoms • ${uniqueAuthors} authors`;

    // Add favorite tags summary
    addFavoriteTagsSummary(works);

    // Update slider max value to match user's actual page count
    if (totalPages && totalPages > 0) {
      pagesSlider.max = totalPages;
      // Update the max label in the HTML
      document.querySelector('.slider-max').textContent = totalPages;
      // Set slider value to the actual pages loaded (for initial load) or keep current value (for reload)
      if (actualPagesLoaded !== undefined) {
        pagesSlider.value = actualPagesLoaded;
      } else {
        const newValue = Math.min(parseInt(pagesSlider.value), totalPages);
        pagesSlider.value = newValue;
      }
    }

    // Update button text to indicate reload and show page selector
    pageSelector.style.display = 'flex';
    updateReloadButtonText();

    // Populate fandom filter
    populateFandomFilter(works);

    // Display all works initially
    displayWorks(works);
  }

  function addFavoriteTagsSummary(works) {
    // Only consider the most recent works (approximately first 2 pages worth)
    // AO3 typically shows 20 works per page, so limit to first 40 works
    const recentWorksLimit = 40;
    const recentWorks = works.slice(0, recentWorksLimit);

    // Count all tags across recent works only
    const tagCounts = {};

    recentWorks.forEach(work => {
      // Count relationships
      if (work.relationships) {
        work.relationships.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
      // Count characters
      if (work.characters) {
        work.characters.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
      // Count freeforms
      if (work.freeforms) {
        work.freeforms.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // Sort tags by frequency and get the most popular one
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1]);

    if (sortedTags.length > 0) {
      // Remove existing summary if it exists
      const existingSummary = document.getElementById('favorite-tags-summary');
      if (existingSummary) {
        existingSummary.remove();
      }

      // Get the most popular tag
      const [mostPopularTag] = sortedTags[0];

      // Create summary element
      const summaryDiv = document.createElement('div');
      summaryDiv.id = 'favorite-tags-summary';
      summaryDiv.className = 'favorite-tags-summary';
      summaryDiv.innerHTML = `
        <p class="summary-text">So you've been really into ${escapeHtml(mostPopularTag)} lately. Love it for you.
        </p>
      `;

      // Insert after header subtitle in the left column
      const headerSubtitle = document.getElementById('header-subtitle');
      headerSubtitle.parentNode.insertBefore(summaryDiv, headerSubtitle.nextSibling);
    }
  }

  function populateFandomFilter(works) {
    // Get all unique fandoms
    const allFandoms = new Set();
    works.forEach(work => {
      work.fandoms.forEach(fandom => allFandoms.add(fandom));
    });

    // Sort fandoms alphabetically
    const sortedFandoms = Array.from(allFandoms).sort();

    // Clear existing options (except "All Fandoms")
    fandomFilter.innerHTML = '<option value="">All Fandoms</option>';

    // Add fandom options
    sortedFandoms.forEach(fandom => {
      const option = document.createElement('option');
      option.value = fandom;
      option.textContent = fandom;
      fandomFilter.appendChild(option);
    });
  }

  function performSearch() {
    const query = searchInput.value.toLowerCase().trim();

    if (query === '') {
      filteredWorks = [...allWorks];
      // Clear matching tags and summary matches when no search
      filteredWorks.forEach(work => {
        work.matchingTags = [];
        work.summaryMatch = null;
      });
    } else {
      filteredWorks = allWorks.filter(work => {
        const matchingTags = [];

        // Check specific tag types and collect matches (skip general 'tags' as they include everything)
        if (work.relationships) {
          work.relationships.forEach(rel => {
            if (rel.toLowerCase().includes(query)) {
              matchingTags.push({type: 'relationship', value: rel});
            }
          });
        }
        if (work.characters) {
          work.characters.forEach(char => {
            if (char.toLowerCase().includes(query)) {
              matchingTags.push({type: 'character', value: char});
            }
          });
        }
        if (work.freeforms) {
          work.freeforms.forEach(tag => {
            if (tag.toLowerCase().includes(query)) {
              matchingTags.push({type: 'freeform', value: tag});
            }
          });
        }

        // Check for summary matches and extract fragment
        let summaryMatch = null;
        if (work.summary && work.summary.toLowerCase().includes(query)) {
          const summaryLower = work.summary.toLowerCase();
          const queryIndex = summaryLower.indexOf(query);
          const start = Math.max(0, queryIndex - 50);
          const end = Math.min(work.summary.length, queryIndex + query.length + 50);
          summaryMatch = work.summary.substring(start, end);

          // Add ellipsis if we truncated
          if (start > 0) summaryMatch = '...' + summaryMatch;
          if (end < work.summary.length) summaryMatch = summaryMatch + '...';
        }

        // Store matching tags and summary fragment on the work object
        work.matchingTags = matchingTags;
        work.summaryMatch = summaryMatch;

        // Return true if any field matches
        return work.title.toLowerCase().includes(query) ||
               work.author.toLowerCase().includes(query) ||
               work.fandoms.some(fandom => fandom.toLowerCase().includes(query)) ||
               work.summary.toLowerCase().includes(query) ||
               matchingTags.length > 0 ||
               (work.tags && work.tags.some(tag => tag.toLowerCase().includes(query)));
      });
    }

    applyFilter();
  }

  function applyFilter() {
    const selectedFandom = fandomFilter.value;

    // Apply fandom filter to the filtered works
    let worksToDisplay = [...filteredWorks];
    if (selectedFandom) {
      worksToDisplay = worksToDisplay.filter(work =>
        work.fandoms.includes(selectedFandom)
      );
    }

    // Always sort by most recent
    worksToDisplay.sort((a, b) => {
      if (a.lastVisited && b.lastVisited) {
        return new Date(b.lastVisited) - new Date(a.lastVisited);
      }
      return 0;
    });

    displayWorks(worksToDisplay);
  }

  function displayWorks(works) {
    if (works.length === 0) {
      worksList.style.display = 'none';
      noResults.style.display = 'block';
      // Remove narrow search message when there are no results
      const existingMessage = document.getElementById('narrow-search-message');
      if (existingMessage) {
        existingMessage.remove();
      }
      return;
    }

    worksList.style.display = 'grid';
    noResults.style.display = 'none';

    // Limit to 20 results
    const maxResults = 20;
    const hasMoreResults = works.length > maxResults;
    const worksToShow = works.slice(0, maxResults);

    worksList.innerHTML = worksToShow.map((work, index) => `
      <div class="work-item">
        <div class="work-header">
          <h3><a href="${work.url}" target="_blank" rel="noopener">${escapeHtml(work.title)}</a></h3>
          <span class="work-number">#${index + 1}</span>
        </div>
        <p class="author">by ${work.authorUrl ? `<a href="${work.authorUrl}" target="_blank" rel="noopener">${escapeHtml(work.author)}</a>` : escapeHtml(work.author)}</p>
        ${work.fandoms.length > 0 ? `<p class="fandoms">${work.fandoms.map(f => escapeHtml(f)).join(', ')}</p>` : ''}
        ${work.matchingTags && work.matchingTags.length > 0 ? `<div class="matching-tags">
          <span class="matching-tags-label">Matching tags:</span>${work.matchingTags.map(tag => `<span class="tag-match tag-${tag.type} clickable-tag" title="${tag.type.charAt(0).toUpperCase() + tag.type.slice(1)} tag - Click to search" data-tag="${escapeHtml(tag.value)}">${escapeHtml(tag.value)}</span>`).join('')}
        </div>` : ''}
        ${work.summaryMatch ? `<div class="summary-match">
          <span class="summary-match-label">Summary match:</span>
          <p class="summary-fragment">${escapeHtml(work.summaryMatch)}</p>
        </div>` : ''}
        <div class="metadata">
          ${work.words ? `<span class="words">${escapeHtml(work.words)} words</span>` : ''}
          ${work.chapters ? `<span class="chapters">${escapeHtml(work.chapters)} chapters</span>` : ''}
          ${work.publishDate ? `<span class="date">Published: ${escapeHtml(work.publishDate)}</span>` : ''}
        </div>
        ${work.lastVisited ? `<p class="last-visited">Last visited: ${escapeHtml(work.lastVisited)}</p>` : ''}
        ${work.summary && !work.summaryMatch ? `<p class="summary">${escapeHtml(work.summary.substring(0, 300))}${work.summary.length > 300 ? '...' : ''}</p>` : ''}
      </div>
    `).join('');

    // Add message if there are more results
    if (hasMoreResults) {
      // Remove existing narrow search message if it exists
      const existingMessage = document.getElementById('narrow-search-message');
      if (existingMessage) {
        existingMessage.remove();
      }

      // Create and insert message outside the grid
      const messageDiv = document.createElement('div');
      messageDiv.id = 'narrow-search-message';
      messageDiv.className = 'narrow-search-message';
      messageDiv.innerHTML = `
        <p>Showing ${maxResults} of ${works.length} results. <strong>Narrow your search</strong> to see more specific matches.</p>
      `;

      // Insert after the works-list div
      worksList.parentNode.insertBefore(messageDiv, worksList.nextSibling);
    } else {
      // Remove message if no longer needed
      const existingMessage = document.getElementById('narrow-search-message');
      if (existingMessage) {
        existingMessage.remove();
      }
    }
  }

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

  let lastAO3TabCount = null; // Track the last known tab count (null = not initialized)

  function updateAO3TabStatus() {
    browser.tabs.query({url: `*://${AO3_BASE_URL.replace('https://', '')}/*`}, function (ao3Tabs) {
      const instructionsContent = instructions.querySelector('.welcome-content');
      if (!instructionsContent) return;

      const currentTabCount = ao3Tabs ? ao3Tabs.length : 0;

      // Only update if the tab count has changed (always run on first check)
      if (lastAO3TabCount !== null && currentTabCount === lastAO3TabCount) {
        return;
      }

      lastAO3TabCount = currentTabCount;

      // Remove existing status hint
      const existingHint = instructionsContent.querySelector('.status-hint');
      if (existingHint) {
        existingHint.remove();
      }

      const statusHint = document.createElement('div');
      statusHint.className = 'status-hint';

      if (ao3Tabs && ao3Tabs.length > 0) {
        statusHint.classList.add('success');
        statusHint.innerHTML = `
          <div class="status-hint-title">
            ✅ Found ${ao3Tabs.length} AO3 tab${ao3Tabs.length > 1 ? 's' : ''}!
          </div>
          <div class="status-hint-text">
            Will use the first tab where you're logged in.
          </div>
        `;
      } else {
        statusHint.classList.add('error');
        statusHint.innerHTML = `
          <div class="status-hint-title">
            ❌ No AO3 tabs found
          </div>
          <div class="status-hint-text">
            Please open AO3 in another tab first.
          </div>
          <button id="open-ao3-btn" class="status-hint-btn">
            Open AO3
          </button>
        `;

        // Add event listener to the Open AO3 button
        const openAO3Btn = statusHint.querySelector('#open-ao3-btn');
        if (openAO3Btn) {
          openAO3Btn.addEventListener('click', () => {
            browser.tabs.create({url: AO3_BASE_URL});
          });
        }
      }

      instructionsContent.appendChild(statusHint);
    });
  }

  // Initial check for AO3 tabs
  updateAO3TabStatus();

  // Check every few seconds for new tabs
  setInterval(updateAO3TabStatus, 3000);
});
