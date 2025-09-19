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
  button.textContent = '📚 FicTrail';
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


  // Add event listeners with error checking
  const closeBtn = document.getElementById('fictrail-close');
  const loadBtn = document.getElementById('fictrail-load-btn');
  const retryBtn = document.getElementById('fictrail-retry-btn');
  const searchInput = document.getElementById('fictrail-search-input');
  const fandomFilter = document.getElementById('fictrail-fandom-filter');
  const pagesSlider = document.getElementById('fictrail-pages-slider');

  if (closeBtn) closeBtn.addEventListener('click', closeFicTrail);
  if (loadBtn) loadBtn.addEventListener('click', reloadHistory);
  if (retryBtn) retryBtn.addEventListener('click', retryLastAction);
  if (searchInput) searchInput.addEventListener('input', debounce(performSearch, 300));
  if (fandomFilter) fandomFilter.addEventListener('change', applyFilter);
  if (pagesSlider) pagesSlider.addEventListener('input', updatePagesValue);
}

function openFicTrail() {
  // Create FicTrail if it doesn't exist
  if (!document.getElementById('fictrail-container')) {
    createOverlay();
  }

  const mainElement = document.getElementById('main');
  const fictrailContainer = document.getElementById('fictrail-container');

  if (mainElement) {
    // Hide all children of #main except FicTrail
    Array.from(mainElement.children).forEach(child => {
      if (child.id !== 'fictrail-container') {
        child.style.display = 'none';
      }
    });
  }

  if (fictrailContainer) fictrailContainer.style.display = 'block';

  // Only load data if we don't have any works yet
  if (allWorks.length === 0) {
    // Show loading state immediately
    showFicTrailLoading();
    setTimeout(() => {
      loadFirstPage();
    }, 100);
  } else {
    // Show existing results
    showFicTrailResults();
  }
}

function closeFicTrail() {
  const mainElement = document.getElementById('main');
  const fictrailContainer = document.getElementById('fictrail-container');

  if (mainElement) {
    // Show all children of #main except FicTrail
    Array.from(mainElement.children).forEach(child => {
      if (child.id !== 'fictrail-container') {
        child.style.display = '';
      }
    });
  }

  if (fictrailContainer) fictrailContainer.style.display = 'none';
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
  const currentPages = parseInt(document.getElementById('fictrail-pages-slider').value);
  const footer = document.getElementById('fictrail-footer');
  const loadBtn = document.getElementById('fictrail-load-btn');

  // Check if we're in reload mode (footer is visible)
  if (footer.style.display === 'block') {
    loadBtn.textContent = `Reload History (${currentPages} ${currentPages === 1 ? 'page' : 'pages'})`;
  }
}

function getPagesToLoad() {
  const slider = document.getElementById('fictrail-pages-slider');
  // If slider doesn't exist yet, default to 1 page
  if (!slider) return 1;
  return parseInt(slider.value);
}


function displayWorks(works, append = false) {
  const worksListContainer = document.getElementById('fictrail-works-container');
  const worksList = document.getElementById('fictrail-works-list');
  const noResults = document.getElementById('fictrail-no-results');

  if (works.length === 0) {
    worksListContainer.style.display = 'none';
    noResults.style.display = 'block';
    // Remove existing load more button and message when there are no results
    removeLoadMoreElements();
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

            <!--warnings again, cast, freeform tags-->
            ${(() => {
                // Always show all tags, but highlight matching ones
                const allTags = [
                    ...(work.warnings || []).map(tag => ({ type: 'warning', value: tag })),
                    ...(work.relationships || []).map(tag => ({ type: 'relationship', value: tag })),
                    ...(work.characters || []).map(tag => ({ type: 'character', value: tag })),
                    ...(work.freeforms || []).map(tag => ({ type: 'freeform', value: tag }))
                ];

                if (allTags.length === 0) return '';

                // Create a set of matching tag values for quick lookup
                const matchingTagValues = new Set((work.matchingTags || []).map(tag => tag.value));

                return `<h6 class="landmark heading">Tags</h6>
                <ul class="tags commas">
                    ${allTags.map(tag => {
                        let className = '';
                        if (tag.type === 'relationship') className = 'relationships';
                        else if (tag.type === 'character') className = 'characters';
                        else if (tag.type === 'freeform') className = 'freeforms';
                        else if (tag.type === 'warning') className = 'warnings';

                        // Add highlight class if this tag matches the search
                        const isMatching = matchingTagValues.has(tag.value);
                        const tagClass = isMatching ? 'tag fictrail-highlight' : 'tag';

                        return `<li class="${className}"><a class="${tagClass}" href="/tags/${encodeURIComponent(tag.value)}/works" target="_blank" rel="noopener">${escapeHtml(tag.value)}</a></li>`;
                    }).join(' ')}
                </ul>`;
            })()}

            <!--summary-->
            ${work.summary ? `<h6 class="landmark heading">Summary</h6>
            <blockquote class="userstuff summary">
                ${(() => {
                    let summaryHTML = work.summary;

                    // Get current search query and highlight matching text
                    const searchInput = document.getElementById('fictrail-search-input');
                    if (searchInput && searchInput.value.trim()) {
                        const searchQuery = searchInput.value.trim();
                        const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        summaryHTML = summaryHTML.replace(
                            new RegExp(`(${escapedQuery})`, 'gi'),
                            '<span class="fictrail-highlight fictrail-highlight-text">$1</span>'
                        );
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

  // Remove existing load more elements before adding new ones
  removeLoadMoreElements();

  // Add load more button if there are more results
  if (hasMoreResults) {
    createLoadMoreButton(works, currentDisplayCount);
  }
}

function removeLoadMoreElements() {
  const existingContainer = document.getElementById('fictrail-load-more-container');
  if (existingContainer) existingContainer.remove();
}

function createLoadMoreButton(works, currentCount) {
  const worksList = document.getElementById('fictrail-works-list');
  const remainingCount = works.length - currentCount;
  const nextBatchSize = Math.min(ITEMS_PER_PAGE, remainingCount);

  // Create container for load more elements using AO3 structure
  const containerDiv = document.createElement('div');
  containerDiv.id = 'fictrail-load-more-container';
  containerDiv.className = 'fictrail-load-more-container';

  // Create load more message
  const messageDiv = document.createElement('div');
  messageDiv.id = 'fictrail-load-more-message';
  messageDiv.innerHTML = `
    <p>Showing ${currentCount} of ${works.length} ${works.length === 1 ? 'result' : 'results'}</p>
  `;

  // Create load more button using AO3 actions structure
  const buttonDiv = document.createElement('div');
  buttonDiv.innerHTML = `
    <button class="button" id="fictrail-load-more-button">
      Load ${nextBatchSize} More ${nextBatchSize === 1 ? 'Result' : 'Results'}
    </button>
  `;

  // Add message and button to container
  containerDiv.appendChild(messageDiv);
  containerDiv.appendChild(buttonDiv);

  // Insert container after the works-list div
  worksList.parentNode.insertBefore(containerDiv, worksList.nextSibling);

  // Add event listener to the load more button
  const loadMoreButton = document.getElementById('fictrail-load-more-button');
  loadMoreButton.addEventListener('click', loadMoreWorks);
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
