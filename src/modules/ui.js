// UI Module - DOM creation and event handling

// HTML Template Functions
const Templates = {
  workItem(work, index) {
    return `
      <li id="work_${work.url.match(/\/works\/(\d+)/)?.[1] || 'unknown'}" 
          class="reading work blurb group work-${work.url.match(/\/works\/(\d+)/)?.[1] || 'unknown'}" 
          role="article">
        ${this.workHeader(work)}
        ${this.workTags(work)}
        ${this.workSummary(work)}
        ${this.workSeries(work)}
        ${this.workStats(work)}
        ${this.workUserModule(work)}
      </li>
    `;
  },

  workHeader(work) {
    // Get current search query for highlighting
    const searchInput = document.getElementById('fictrail-search-input');
    const searchQuery = searchInput ? searchInput.value.trim() : '';

    // Apply highlighting to title and author
    const highlightedTitle = searchQuery ?
      highlightSearchTerms(escapeHtml(work.title), searchQuery) :
      escapeHtml(work.title);

    const highlightedAuthor = searchQuery ?
      highlightSearchTerms(escapeHtml(work.author), searchQuery) :
      escapeHtml(work.author);

    return `
      <div class="header module">
        <h4 class="heading">
          <a href="${work.url}" target="_blank" rel="noopener">${highlightedTitle}</a>
          by
          ${work.authorUrl
      ? `<a rel="author" href="${work.authorUrl}" target="_blank" rel="noopener">${highlightedAuthor}</a>`
      : highlightedAuthor
    }
        </h4>
        ${this.workFandoms(work)}
        ${this.workRequiredTags(work)}
        ${work.publishDate ? `<p class="datetime">${escapeHtml(work.publishDate)}</p>` : ''}
      </div>
    `;
  },

  workFandoms(work) {
    // Get current search query for highlighting
    const searchInput = document.getElementById('fictrail-search-input');
    const searchQuery = searchInput ? searchInput.value.trim() : '';

    return `
      <h5 class="fandoms heading">
        <span class="landmark">Fandoms:</span>
        ${work.fandoms.map(fandom => {
      const highlightedFandom = searchQuery ?
        highlightSearchTerms(escapeHtml(fandom.text), searchQuery) :
        escapeHtml(fandom.text);

      return `<a class="tag" href="${fandom.url}" target="_blank" rel="noopener">${highlightedFandom}</a>`;
    }).join(', ')}
        &nbsp;
      </h5>
    `;
  },

  workRequiredTags(work) {
    const tags = [];

    if (work.rating && work.ratingClass) {
      tags.push(this.requiredTag(work.rating, work.ratingClass));
    }

    // Use warningSpans for required-tags display (single element per span with full text)
    // Fall back to warnings + warningClasses for backward compatibility
    if (work.warningSpans && work.warningSpans.length > 0) {
      work.warningSpans.forEach(warningSpan => {
        tags.push(this.requiredTag(warningSpan.text, warningSpan.class || ''));
      });
    } else if (work.warnings && work.warningClasses) {
      // Backward compatibility: if warningSpans not available, use warnings + warningClasses
      work.warnings.forEach((warning, index) => {
        tags.push(this.requiredTag(warning.text, work.warningClasses[index] || ''));
      });
    }

    if (work.categories && work.categoryClasses) {
      work.categories.forEach((category, index) => {
        tags.push(this.requiredTag(category, work.categoryClasses[index] || ''));
      });
    }

    if (work.status && work.statusClass) {
      tags.push(this.requiredTag(work.status, work.statusClass));
    }

    return tags.length > 0 ? `<ul class="required-tags">${tags.join('')}</ul>` : '';
  },

  requiredTag(title, cssClass) {
    return `
      <li>
        <a class="help symbol question modal modal-attached" 
           title="Symbols key" 
           href="/help/symbols-key.html" 
           aria-controls="modal">
          <span class="${cssClass}" title="${escapeHtml(title)}">
            <span class="text">${escapeHtml(title)}</span>
          </span>
        </a>
      </li>
    `;
  },

  workTags(work) {
    const tagsToShow = getTagsToDisplay(work);
    if (tagsToShow.length === 0) return '';

    return `
      <h6 class="landmark heading">Tags</h6>
      <ul class="tags commas">
        ${tagsToShow.map(tag => this.tagItem(tag)).join(' ')}
      </ul>
    `;
  },

  tagItem(tag) {
    const cssClass = getTagCssClass(tag.type);
    const tagValue = tag.value || tag.text;
    const tagUrl = tag.url || `/tags/${encodeURIComponent(tagValue)}/works`;
    let escapedValue = escapeHtml(tagValue);

    // Highlight search terms if there's a search query
    const searchInput = document.getElementById('fictrail-search-input');
    const searchQuery = searchInput ? searchInput.value.trim() : '';
    if (searchQuery) {
      escapedValue = highlightSearchTerms(escapedValue, searchQuery);
    }

    return `
      <li class="${cssClass}">
        <a class="tag" 
           href="${tagUrl}" 
           target="_blank" 
           rel="noopener">${escapedValue}</a>
      </li>
    `;
  },

  workSummary(work) {
    if (!work.summary) return '';

    let summaryHTML = work.summary;
    const searchInput = document.getElementById('fictrail-search-input');
    if (searchInput && searchInput.value.trim()) {
      summaryHTML = highlightSearchTerms(summaryHTML, searchInput.value.trim());
    }

    return `
      <h6 class="landmark heading">Summary</h6>
      <blockquote class="userstuff summary fictrail-summary">
        ${summaryHTML}
      </blockquote>
    `;
  },

  workSeries(work) {
    if (!work.series || work.series.length === 0) return '';

    return `
      <h6 class="landmark heading">Series</h6>
      <ul class="series">
        ${work.series.map(series => `
          <li>
            Part <strong>${series.part}</strong> of 
            <a href="${series.url}" target="_blank" rel="noopener">${escapeHtml(series.title)}</a>
          </li>
        `).join('')}
      </ul>
    `;
  },

  workStats(work) {
    const stats = work.stats || {};
    const hasStats = Object.values(stats).some(value => value && value.trim());
    if (!hasStats) return '';

    const statItems = [];
    const statFields = [
      { key: 'language', label: 'Language' },
      { key: 'words', label: 'Words' },
      { key: 'chapters', label: 'Chapters' },
      { key: 'collections', label: 'Collections' },
      { key: 'comments', label: 'Comments' },
      { key: 'kudos', label: 'Kudos' },
      { key: 'bookmarks', label: 'Bookmarks' },
      { key: 'hits', label: 'Hits' }
    ];

    statFields.forEach(field => {
      if (stats[field.key]) {
        statItems.push(`
          <dt class="${field.key.toLowerCase()}">${field.label}:</dt>
          <dd class="${field.key.toLowerCase()}" ${field.key === 'language' ? 'lang="en"' : ''}>
            ${escapeHtml(stats[field.key])}
          </dd>
        `);
      }
    });

    return statItems.length > 0 ? `<dl class="stats">${statItems.join('')}</dl>` : '';
  },

  workUserModule(work) {
    return `
      <div class="user module group">
        <h4 class="viewed heading">
          <span>Last visited:</span> ${work.lastVisited || 'Unknown'}
        </h4>
      </div>
    `;
  },

  loadMoreSection(works, currentCount) {
    const remainingCount = works.length - currentCount;
    const nextBatchSize = Math.min(ITEMS_PER_PAGE, remainingCount);

    return {
      message: `<p>Showing ${currentCount} of ${works.length} ${works.length === 1 ? 'result' : 'results'}</p>`,
      buttonText: `Load ${nextBatchSize} More ${nextBatchSize === 1 ? 'Result' : 'Results'}`
    };
  },

  favoriteTagsSummary(tag) {
    return `So you've been really into ${escapeHtml(tag)} lately. Love it for you.`;
  }
};

// DOM Element Creation Functions
const DOMHelpers = {
  createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    });

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  },

  createButton(id, text, clickHandler, keydownHandler = null) {
    const button = this.createElement('a', {
      id,
      style: { cursor: 'pointer' },
      tabIndex: 0
    }, text);

    button.addEventListener('click', clickHandler);

    if (keydownHandler) {
      button.addEventListener('keydown', keydownHandler);
    } else {
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          clickHandler();
        }
      });
    }

    return button;
  }
};

// Create FicTrail button - try history page placement first
function createFicTrailButton() {
  // Only add to history page if we're on the readings page
  if (window.location.pathname.includes('/readings')) {
    addToHistoryPage();
  }
}

// Add FicTrail button in front of "Full History" in subnav
function addToHistoryPage() {
  const subNav = document.querySelector('ul.navigation.actions[role="navigation"]');
  if (!subNav) return false;

  const listItem = DOMHelpers.createElement('li');
  const button = DOMHelpers.createButton('fictrail-history-btn', 'FicTrail', openFicTrail);

  listItem.appendChild(button);
  subNav.insertBefore(listItem, subNav.firstChild);

  return true;
}

// Update navigation links with current user's URLs
function updateNavigationLinks() {
  const username = getUsername();
  if (!username) {
    console.warn('Could not determine username for navigation links');
    return;
  }

  const fullHistoryLink = document.getElementById('fictrail-full-history-link');
  const markedLaterLink = document.getElementById('fictrail-marked-later-link');
  const clearHistoryLink = document.getElementById('fictrail-clear-history-link');

  if (fullHistoryLink) {
    fullHistoryLink.href = `/users/${username}/readings`;
  }
  if (markedLaterLink) {
    markedLaterLink.href = `/users/${username}/readings?show=to-read`;
  }
  if (clearHistoryLink) {
    clearHistoryLink.href = `/users/${username}/readings/clear`;
  }
}

// Create FicTrail content inside #main
function createOverlay() {
  // Check if overlay already exists
  if (document.getElementById('fictrail-container')) return;

  const mainElement = document.getElementById('main');
  if (!mainElement) {
    console.error('Could not find #main element');
    return;
  }

  // Create FicTrail container
  const fictrailDiv = DOMHelpers.createElement('div', {
    id: 'fictrail-container'
  });

  // HTML template will be injected here during build
  fictrailDiv.innerHTML = '<!-- This will be replaced by build script -->';

  // Insert FicTrail inside #main
  mainElement.appendChild(fictrailDiv);

  // Update navigation links with current user's URLs
  updateNavigationLinks();

  // Set default slider value after creating the overlay
  setTimeout(() => {
    const slider = document.getElementById('fictrail-pages-slider');
    if (slider) {
      slider.value = DEFAULT_PAGES_TO_LOAD;
      updateReloadButtonText();
    }
  }, 0);

  // Add event listeners
  attachEventListeners();
}

// Centralized event listener attachment
function attachEventListeners() {
  const eventMap = [
    { id: 'fictrail-load-btn', event: 'click', handler: reloadHistory },
    { id: 'fictrail-retry-btn', event: 'click', handler: reloadHistory },
    { id: 'fictrail-search-input', event: 'input', handler: debounce(performSearch, 300) },
    { id: 'fictrail-fandom-filter', event: 'change', handler: applyFilter },
    { id: 'fictrail-pages-slider', event: 'input', handler: updatePagesValue },
    { id: 'fictrail-pages-toggle', event: 'click', handler: togglePagesSection },
    { id: 'fictrail-top-btn', event: 'click', handler: scrollToTop }
  ];

  eventMap.forEach(({ id, event, handler }) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener(event, handler);

      // Add keyboard support for clickable elements
      if (event === 'click') {
        element.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handler();
          }
        });
      }
    }
  });
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

  // Show bottom actions when results are displayed
  const bottomActions = document.getElementById('fictrail-bottom-actions');
  if (bottomActions) {
    bottomActions.style.display = 'block';
  }
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
  const bottomActions = document.getElementById('fictrail-bottom-actions');

  if (works.length === 0) {
    worksListContainer.style.display = 'none';
    noResults.style.display = 'block';
    hideLoadMoreButton();
    // Hide bottom actions when no results
    if (bottomActions) bottomActions.style.display = 'none';
    return;
  }

  worksListContainer.style.display = 'block';
  noResults.style.display = 'none';
  // Show bottom actions when there are results
  if (bottomActions) bottomActions.style.display = 'block';

  // Reset display count if not appending (new search/filter)
  if (!append) {
    currentDisplayCount = ITEMS_PER_PAGE;
  }

  const worksToShow = works.slice(0, currentDisplayCount);
  const hasMoreResults = works.length > currentDisplayCount;

  // Generate HTML for works to display
  const worksToRender = worksToShow.slice(append ? currentDisplayCount - ITEMS_PER_PAGE : 0);
  const worksHTML = worksToRender.map((work, index) => Templates.workItem(work, index)).join('');

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
    // Count relationships, characters, and freeforms
    ['relationships', 'characters', 'freeforms'].forEach(tagType => {
      if (work[tagType]) {
        work[tagType].forEach(tag => {
          tagCounts[tag.text] = (tagCounts[tag.text] || 0) + 1;
        });
      }
    });
  });

  // Sort tags by frequency and get the most popular one
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  if (sortedTags.length > 0) {
    // Remove existing summary if it exists
    const existingSummary = document.getElementById('fictrail-favorite-tags-summary');
    if (existingSummary) {
      existingSummary.remove();
    }

    // Get the most popular tag and create summary element
    const [mostPopularTag] = sortedTags[0];
    const summaryDiv = DOMHelpers.createElement('p', {
      id: 'fictrail-favorite-tags-summary'
    });
    summaryDiv.innerHTML = Templates.favoriteTagsSummary(mostPopularTag);

    // Insert in the designated container
    const summaryContainer = document.getElementById('fictrail-favorite-tags-summary-container');
    if (summaryContainer) {
      summaryContainer.appendChild(summaryDiv);
    }
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
  const warningTags = (work.warnings || []).map(tag => ({
    type: 'warning',
    value: tag.text,
    url: tag.url
  }));

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
      ...(work.relationships || []).map(tag => ({ type: 'relationship', value: tag.text, url: tag.url })),
      ...(work.characters || []).map(tag => ({ type: 'character', value: tag.text, url: tag.url })),
      ...(work.freeforms || []).map(tag => ({ type: 'freeform', value: tag.text, url: tag.url }))
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

function showLoadMoreButton(works, currentCount) {
  const loadMoreContainer = document.getElementById('fictrail-load-more-container');
  const loadMoreMessage = document.getElementById('fictrail-load-more-message');
  const loadMoreButton = document.getElementById('fictrail-load-more-button');

  if (!loadMoreContainer || !loadMoreMessage || !loadMoreButton) return;

  const loadMoreContent = Templates.loadMoreSection(works, currentCount);

  // Update message and button
  loadMoreMessage.innerHTML = loadMoreContent.message;
  loadMoreButton.textContent = loadMoreContent.buttonText;

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

  const isExpanded = content.classList.contains('ft-expanded');

  if (isExpanded) {
    // Collapse
    toggle.classList.remove('ft-expanded');
    content.classList.remove('ft-expanded');
  } else {
    // Expand
    toggle.classList.add('ft-expanded');
    content.classList.add('ft-expanded');
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

        // Create a document fragment to avoid extra wrapper spans
        const fragment = document.createDocumentFragment();
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = highlightedText;

        // Move all child nodes from temp container to fragment
        while (tempContainer.firstChild) {
          fragment.appendChild(tempContainer.firstChild);
        }

        // Replace the text node with the fragment contents
        node.parentNode.replaceChild(fragment, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Recursively process child nodes (need to convert to array first since we're modifying)
      const children = Array.from(node.childNodes);
      children.forEach(child => highlightInTextNodes(child));
    }
  }

  highlightInTextNodes(tempDiv);
  return tempDiv.innerHTML;
}

function scrollToTop(event) {
  event.preventDefault();

  // Scroll to the top of the main element (where FicTrail is)
  const mainElement = document.getElementById('main');
  if (mainElement) {
    mainElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  } else {
    // Fallback to scrolling to top of page
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
