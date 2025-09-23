// UI Module - DOM creation and event handling

// Create FicTrail button - try history page placement first
function createFicTrailButton() {
  // Only add to history page if we're on the readings page
  if (window.location.pathname.includes('/readings')) {
    addToHistoryPage()
  }
}

// Add FicTrail button in front of "Full History" in subnav
function addToHistoryPage() {
  const subNav = document.querySelector('ul.navigation.actions[role="navigation"]');

  if (!subNav) {
    return false; // Subnav not found
  }

  // Create list item for the button
  const listItem = document.createElement('li');

  // Create the button using AO3's button styles
  const button = document.createElement('a');
  button.id = 'fictrail-history-btn';
  button.textContent = 'FicTrail';
  button.style.cursor = 'pointer';
  button.tabIndex = 0;

  button.addEventListener('click', openFicTrail);

  // Add keyboard support
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFicTrail();
    }
  });

  listItem.appendChild(button);

  // Insert at the beginning of the subnav
  subNav.insertBefore(listItem, subNav.firstChild);

  return true;
}

// Create FicTrail content inside #main
function createOverlay() {
  // Check if overlay already exists
  if (document.getElementById('fictrail-container')) {
    return;
  }

  const mainElement = document.getElementById('main');
  if (!mainElement) {
    console.error('Could not find #main element');
    return;
  }

  // Create FicTrail container
  const fictrailDiv = document.createElement('div');
  fictrailDiv.id = 'fictrail-container';
  // HTML template will be injected here during build
  fictrailDiv.innerHTML = '<!-- This will be replaced by build script -->';

  // Insert FicTrail inside #main
  mainElement.appendChild(fictrailDiv);

  // Set default slider value to DEFAULT_PAGES_TO_LOAD after creating the overlay
  setTimeout(() => {
    const slider = document.getElementById('fictrail-pages-slider');
    if (slider) {
      slider.value = DEFAULT_PAGES_TO_LOAD;
      // Update any display elements that show the current value
      updateReloadButtonText();
    }
  }, 0);

  // Add event listeners with error checking
  const loadBtn = document.getElementById('fictrail-load-btn');
  const retryBtn = document.getElementById('fictrail-retry-btn');
  const searchInput = document.getElementById('fictrail-search-input');
  const fandomFilter = document.getElementById('fictrail-fandom-filter');
  const pagesSlider = document.getElementById('fictrail-pages-slider');

  if (loadBtn) {
    loadBtn.addEventListener('click', reloadHistory);
    loadBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        reloadHistory();
      }
    });
  }
  if (retryBtn) {
    retryBtn.addEventListener('click', reloadHistory);
    retryBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        reloadHistory();
      }
    });
  }
  if (searchInput) searchInput.addEventListener('input', debounce(performSearch, 300));
  if (fandomFilter) fandomFilter.addEventListener('change', applyFilter);
  if (pagesSlider) pagesSlider.addEventListener('input', updatePagesValue);

  const pagesToggle = document.getElementById('fictrail-pages-toggle');
  if (pagesToggle) {
    pagesToggle.addEventListener('click', togglePagesSection);
    pagesToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePagesSection();
      }
    });
  }
}

function openFicTrail() {
  if (!document.getElementById('fictrail-container')) {
    createOverlay();
  }

  const mainElement = document.getElementById('main');
  const fictrailContainer = document.getElementById('fictrail-container');

  if (mainElement) {
    Array.from(mainElement.children).forEach(child => {
      if (child.id !== 'fictrail-container') {
        child.style.display = 'none';
      }
    });
  }

  if (fictrailContainer) fictrailContainer.style.display = 'block';

  // Check if we have valid cached data
  if (isCacheValid() && getCachedPageCount() > 0) {
    console.log('Reopening FicTrail with cached data');
    const works = [];
    const maxCachedPage = getMaxCachedPage();

    // Load all cached works
    for (let page = 1; page <= maxCachedPage; page++) {
      if (pageCache.has(page)) {
        works.push(...pageCache.get(page).works);
      }
    }

    if (works.length > 0) {
      displayHistory(getUsername(), works, cachedTotalPages, maxCachedPage);
      return;
    }
  }

  // No valid cache or no works, load fresh data
  if (allWorks.length === 0) {
    showFicTrailLoading();
    setTimeout(() => {
      reloadHistory();
    }, 100);
  } else {
    showFicTrailResults();
  }
}

// Helper functions to show different content states
function showFicTrailState(stateId) {
  const states = ['fictrail-loading', 'fictrail-error', 'fictrail-results'];

  states.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = id === stateId ? 'block' : 'none';
    }
  });
}

function showFicTrailLoading(message = 'Summoning your fic history...') {
  showFicTrailState('fictrail-loading');
  const statusElement = document.getElementById('fictrail-loading-status');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

function showFicTrailError(message) {
  showFicTrailState('fictrail-error');
  const errorElement = document.getElementById('fictrail-error-message');
  if (errorElement) {
    errorElement.innerHTML = message;
  }
}

function showFicTrailResults() {
  showFicTrailState('fictrail-results');
}

function updatePagesValue() {
  updateReloadButtonText();
}

function updateReloadButtonText() {
  const slider = document.getElementById('fictrail-pages-slider');
  if (!slider) return;

  const currentPages = parseInt(slider.value);
  const pagesInfo = document.getElementById('fictrail-pages-info');
  const loadBtn = document.getElementById('fictrail-load-btn');

  if (!loadBtn) return;

  // Check if we're in reload mode (pagesInfo is visible)
  if (pagesInfo && pagesInfo.style.display === 'block') {
    loadBtn.textContent = `Reload History (${currentPages} ${currentPages === 1 ? 'page' : 'pages'})`;
  }
}

function getPagesToLoad() {
  const slider = document.getElementById('fictrail-pages-slider');
  // If slider doesn't exist yet, use default
  if (!slider) return DEFAULT_PAGES_TO_LOAD;
  return parseInt(slider.value);
}


function displayWorks(works, append = false) {
  const worksListContainer = document.getElementById('fictrail-works-container');
  const worksList = document.getElementById('fictrail-works-list');
  const noResults = document.getElementById('fictrail-no-results');

  if (works.length === 0) {
    worksListContainer.style.display = 'none';
    noResults.style.display = 'block';
    hideLoadMoreButton();
    return;
  }

  worksListContainer.style.display = 'block';
  noResults.style.display = 'none';

  // Reset display count if not appending (new search/filter)
  if (!append) {
    currentDisplayCount = ITEMS_PER_PAGE;
  }

  const worksToShow = works.slice(0, currentDisplayCount);
  const hasMoreResults = works.length > currentDisplayCount;

  // Calculate starting index for work numbers
  const startIndex = append ? worksList.children.length : 0;

  const worksHTML = worksToShow
    .slice(append ? currentDisplayCount - ITEMS_PER_PAGE : 0)
    .map((work, index) => `
        <li id="work_${work.url.match(/\/works\/(\d+)/)?.[1] || 'unknown'}" class="reading work blurb group work-${work.url.match(/\/works\/(\d+)/)?.[1] || 'unknown'}" role="article">
            <!--title, author, fandom-->
            <div class="header module">
                <h4 class="heading">
                    <a href="${work.url}" target="_blank" rel="noopener">${escapeHtml(work.title)}</a>
                    by
                    ${work.authorUrl ? `<a rel="author" href="${work.authorUrl}" target="_blank" rel="noopener">${escapeHtml(work.author)}</a>` : escapeHtml(work.author)}
                </h4>

                <h5 class="fandoms heading">
                    <span class="landmark">Fandoms:</span>
                    ${work.fandoms.map(fandom => `<a class="tag" href="/tags/${encodeURIComponent(fandom)}/works" target="_blank" rel="noopener">${escapeHtml(fandom)}</a>`).join(', ')}
                    &nbsp;
                </h5>

                <!--required tags-->
                <ul class="required-tags">
                    ${work.rating && work.ratingClass ? `<li><a class="help symbol question modal modal-attached" title="Symbols key" href="/help/symbols-key.html" aria-controls="modal"><span class="${work.ratingClass}" title="${escapeHtml(work.rating)}"><span class="text">${escapeHtml(work.rating)}</span></span></a></li>` : ''}
                    ${work.warnings && work.warningClasses ? work.warnings.map((warning, index) => `<li><a class="help symbol question modal modal-attached" title="Symbols key" href="/help/symbols-key.html" aria-controls="modal"><span class="${work.warningClasses[index] || ''}" title="${escapeHtml(warning)}"><span class="text">${escapeHtml(warning)}</span></span></a></li>`).join('') : ''}
                    ${work.categories && work.categoryClasses ? work.categories.map((category, index) => `<li><a class="help symbol question modal modal-attached" title="Symbols key" href="/help/symbols-key.html" aria-controls="modal"><span class="${work.categoryClasses[index] || ''}" title="${escapeHtml(category)}"><span class="text">${escapeHtml(category)}</span></span></a></li>`).join('') : ''}
                    ${work.status && work.statusClass ? `<li><a class="help symbol question modal modal-attached" title="Symbols key" href="/help/symbols-key.html" aria-controls="modal"><span class="${work.statusClass}" title="${escapeHtml(work.status)}"><span class="text">${escapeHtml(work.status)}</span></span></a></li>` : ''}
                </ul>
                ${work.publishDate ? `<p class="datetime">${escapeHtml(work.publishDate)}</p>` : ''}
            </div>

            <!--warnings and other tags-->
            ${generateTagsSection(work)}
            
            <!--summary-->
            ${work.summary ? `<h6 class="landmark heading">Summary</h6>
            <blockquote class="userstuff summary fictrail-summary">
                ${(() => {
      let summaryHTML = work.summary;

      // Get current search query and highlight matching text
      const searchInput = document.getElementById('fictrail-search-input');
      if (searchInput && searchInput.value.trim()) {
        summaryHTML = highlightSearchTerms(summaryHTML, searchInput.value.trim());
      }

      return summaryHTML;
    })()}
            </blockquote>` : ''}

            <!--series-->
            ${work.series && work.series.length > 0 ? `<h6 class="landmark heading">Series</h6>
            <ul class="series">
                ${work.series.map(series => `<li>
                    Part <strong>${series.part}</strong> of <a href="${series.url}" target="_blank" rel="noopener">${escapeHtml(series.title)}</a>
                </li>`).join('')}
            </ul>` : ''}

            <!--stats-->
            ${(() => {
      const stats = work.stats || {};
      const hasStats = Object.values(stats).some(value => value && value.trim());

      if (!hasStats) return '';

      return `<dl class="stats">
                    ${stats.language ? `<dt class="language">Language:</dt>
                    <dd class="language" lang="en">${escapeHtml(stats.language)}</dd>` : ''}
                    ${stats.words ? `<dt class="words">Words:</dt>
                    <dd class="words">${escapeHtml(stats.words)}</dd>` : ''}
                    ${stats.chapters ? `<dt class="chapters">Chapters:</dt>
                    <dd class="chapters">${escapeHtml(stats.chapters)}</dd>` : ''}
                    ${stats.collections ? `<dt class="collections">Collections:</dt>
                    <dd class="collections">${escapeHtml(stats.collections)}</dd>` : ''}
                    ${stats.comments ? `<dt class="comments">Comments:</dt>
                    <dd class="comments">${escapeHtml(stats.comments)}</dd>` : ''}
                    ${stats.kudos ? `<dt class="kudos">Kudos:</dt>
                    <dd class="kudos">${escapeHtml(stats.kudos)}</dd>` : ''}
                    ${stats.bookmarks ? `<dt class="bookmarks">Bookmarks:</dt>
                    <dd class="bookmarks">${escapeHtml(stats.bookmarks)}</dd>` : ''}
                    ${stats.hits ? `<dt class="hits">Hits:</dt>
                    <dd class="hits">${escapeHtml(stats.hits)}</dd>` : ''}
                </dl>`;
    })()}

            <div class="user module group">
                <h4 class="viewed heading">
                    <span>Last visited:</span> ${work.lastVisited || 'Unknown'}
                </h4>
            </div>
        </li>
    `)
    .join('');

  if (append) {
    worksList.insertAdjacentHTML('beforeend', worksHTML);
  } else {
    worksList.innerHTML = worksHTML;
  }

  // Show or hide load more button based on remaining results
  if (hasMoreResults) {
    showLoadMoreButton(works, currentDisplayCount);
  } else {
    hideLoadMoreButton();
  }
}

function loadMoreWorks() {
  currentDisplayCount += ITEMS_PER_PAGE;
  displayWorks(filteredWorks, true);
}

function addFavoriteTagsSummary(works) {
  // Only consider the most recent works (approximately first 2 pages worth)
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
    const existingSummary = document.getElementById('fictrail-favorite-tags-summary');
    if (existingSummary) {
      existingSummary.remove();
    }

    // Get the most popular tag
    const [mostPopularTag] = sortedTags[0];

    // Create summary element using AO3 structure
    const summaryDiv = document.createElement('p');
    summaryDiv.id = 'fictrail-favorite-tags-summary';
    summaryDiv.innerHTML = `So you've been really into ${escapeHtml(mostPopularTag)} lately. Love it for you.`;

    // Insert in the designated container
    const summaryContainer = document.getElementById('fictrail-favorite-tags-summary-container');
    summaryContainer.appendChild(summaryDiv);
  }
}

/**
 * Determines which tags to display based on search state
 * @param {Object} work - The work object
 * @returns {Array} Array of tag objects with type and value
 */
function getTagsToDisplay(work) {
  const searchInput = document.getElementById('fictrail-search-input');
  const hasSearchQuery = searchInput && searchInput.value.trim();

  // Always include warnings
  const warningTags = (work.warnings || []).map(tag => ({ type: 'warning', value: tag }));

  if (hasSearchQuery) {
    // Show warnings plus matching tags during search
    const matchingTags = work.matchingTags || [];
    // Filter out warnings from matchingTags to avoid duplicates
    const nonWarningMatchingTags = matchingTags.filter(tag => tag.type !== 'warning');
    return [...warningTags, ...nonWarningMatchingTags];
  } else {
    // Show all tags when no search query
    return [
      ...warningTags,
      ...(work.relationships || []).map(tag => ({ type: 'relationship', value: tag })),
      ...(work.characters || []).map(tag => ({ type: 'character', value: tag })),
      ...(work.freeforms || []).map(tag => ({ type: 'freeform', value: tag }))
    ];
  }
}

/**
 * Gets the CSS class name for a tag type
 * @param {string} tagType - The type of tag (warning, relationship, character, freeform)
 * @returns {string} The CSS class name
 */
function getTagCssClass(tagType) {
  const classMap = {
    'relationship': 'relationships',
    'character': 'characters',
    'freeform': 'freeforms',
    'warning': 'warnings'
  };
  return classMap[tagType] || '';
}

/**
 * Generates HTML for the tags section
 * @param {Object} work - The work object
 * @returns {string} HTML string for the tags section
 */
function generateTagsSection(work) {
  const tagsToShow = getTagsToDisplay(work);

  if (tagsToShow.length === 0) {
    return '';
  }

  const searchInput = document.getElementById('fictrail-search-input');
  const searchQuery = searchInput ? searchInput.value.trim() : '';

  const tagItems = tagsToShow.map(tag => {
    const cssClass = getTagCssClass(tag.type);
    const encodedValue = encodeURIComponent(tag.value);
    let escapedValue = escapeHtml(tag.value);

    // Highlight search terms in tag text
    if (searchQuery) {
      escapedValue = highlightSearchTerms(escapedValue, searchQuery);
    }

    return `<li class="${cssClass}"><a class="tag" href="/tags/${encodedValue}/works" target="_blank" rel="noopener">${escapedValue}</a></li>`;
  }).join(' ');

  return `
    <h6 class="landmark heading">Tags</h6>
    <ul class="tags commas">
      ${tagItems}
    </ul>
  `;
}

function showLoadMoreButton(works, currentCount) {
  const loadMoreContainer = document.getElementById('fictrail-load-more-container');
  const loadMoreMessage = document.getElementById('fictrail-load-more-message');
  const loadMoreButton = document.getElementById('fictrail-load-more-button');

  if (!loadMoreContainer || !loadMoreMessage || !loadMoreButton) return;

  const remainingCount = works.length - currentCount;
  const nextBatchSize = Math.min(ITEMS_PER_PAGE, remainingCount);

  // Update message
  loadMoreMessage.innerHTML = `
    <p>Showing ${currentCount} of ${works.length} ${works.length === 1 ? 'result' : 'results'}</p>
  `;

  // Update button text
  loadMoreButton.textContent = `Load ${nextBatchSize} More ${nextBatchSize === 1 ? 'Result' : 'Results'}`;

  // Show the container
  loadMoreContainer.style.display = 'block';

  // Remove existing event listeners and add new one
  const newButton = loadMoreButton.cloneNode(true);
  loadMoreButton.parentNode.replaceChild(newButton, loadMoreButton);

  // Add event listeners
  newButton.addEventListener('click', loadMoreWorks);
  newButton.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      loadMoreWorks();
    }
  });
}

function hideLoadMoreButton() {
  const loadMoreContainer = document.getElementById('fictrail-load-more-container');
  if (loadMoreContainer) {
    loadMoreContainer.style.display = 'none';
  }
}

function togglePagesSection() {
  const toggle = document.getElementById('fictrail-pages-toggle');
  const content = document.getElementById('fictrail-pages-content');

  if (!toggle || !content) return;

  const isExpanded = content.classList.contains('expanded');

  if (isExpanded) {
    // Collapse
    toggle.classList.remove('expanded');
    content.classList.remove('expanded');
  } else {
    // Expand
    toggle.classList.add('expanded');
    content.classList.add('expanded');
  }
}

function updateToggleText(loadedPages, totalPages) {
  const toggleText = document.getElementById('fictrail-toggle-text');
  if (toggleText && loadedPages && totalPages) {
    toggleText.textContent = `History Pages Loaded (${loadedPages}/${totalPages})`;
  }
}

function highlightSearchTerms(html, searchQuery) {
  if (!searchQuery.trim()) return html;

  // Create a temporary div to work with the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Function to highlight text in text nodes only
  function highlightInTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');

      if (regex.test(text)) {
        const highlightedText = text.replace(regex, '<mark class="fictrail-highlight">$1</mark>');
        const wrapper = document.createElement('span');
        wrapper.innerHTML = highlightedText;
        node.parentNode.replaceChild(wrapper, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Recursively process child nodes
      const children = Array.from(node.childNodes);
      children.forEach(child => highlightInTextNodes(child));
    }
  }

  highlightInTextNodes(tempDiv);
  return tempDiv.innerHTML;
}

