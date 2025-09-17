// UI Module - DOM creation and event handling

// Create FicTrail button
function createFicTrailButton() {
  const button = document.createElement('button');
  button.id = 'fictrail-launch-btn';
  button.textContent = '📚 FicTrail';
  button.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          z-index: 9999;
          transition: all 0.2s ease;
      `;

  button.addEventListener('mouseenter', () => {
    button.style.background = '#2563eb';
    button.style.transform = 'translateY(-2px)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = '#3b82f6';
    button.style.transform = 'translateY(0)';
  });

  button.addEventListener('click', openFicTrail);
  document.body.appendChild(button);
}

// Create overlay HTML
function createOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'fictrail-overlay';

  overlay.innerHTML = `
          <div id="fictrail-container">
              <div id="fictrail-content">
                  <header class="fictrail-header">
                      <div id="fictrail-header-main">
                          <h1>📚 FicTrail</h1>
                          <p id="fictrail-subtitle">Your AO3 History</p>
                      </div>
                      <div id="fictrail-controls" style="display: flex; flex-direction: column; align-items: center;">
                      </div>
                      <div id="fictrail-close-btn">
                          <button id="fictrail-close">×</button>
                      </div>
                  </header>
                  
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;">
                  
                  <main class="fictrail-main">
                      <div id="fictrail-loading-section" class="fictrail-loading" style="display: none;">
                          <div class="fictrail-spinner"></div>
                          <h2>Summoning your fic history...</h2>
                          <p id="fictrail-loading-status">Diving deep into your AO3 rabbit hole...</p>
                      </div>
                      
                      <div id="fictrail-error-section" class="fictrail-error" style="display: none;">
                          <h2>💀 Plot Twist!</h2>
                          <p id="fictrail-error-message"></p>
                          <button id="fictrail-retry-btn" class="fictrail-btn-secondary">Try Again (Please?)</button>
                      </div>
                      
                      <div id="fictrail-history-section" class="fictrail-history" style="display: none;">
                          <div class="fictrail-controls">
                              <div class="fictrail-search">
                                  <input type="text" id="fictrail-search-input" placeholder="Search by fandoms, titles, tags, authors, or summaries...">
                              </div>
                              <div class="fictrail-filter">
                                  <select id="fictrail-fandom-filter">
                                      <option value="">All Fandoms</option>
                                  </select>
                              </div>
                          </div>
                          
                          <div id="fictrail-works-list" class="fictrail-works"></div>
                          
                          <div id="fictrail-no-results" class="fictrail-no-results" style="display: none;">
                              <h3>No Results Found</h3>
                              <p>Your search came up empty! Try different keywords or maybe you haven't read that trope yet? 👀</p>
                          </div>
                          
                          <footer id="fictrail-footer" class="fictrail-footer" style="display: none;">
                              <div class="fictrail-footer-content">
                                  <div class="fictrail-page-selector" id="fictrail-page-selector">
                                      <div class="fictrail-page-selector-header">
                                          <label for="fictrail-pages-slider" id="fictrail-pages-label">You have ? pages of history. How deep should we search?</label>
                                      </div>
                                      <div class="fictrail-info-message">
                                          <p>Loading many pages can be slow. Start with fewer pages for better performance, then reload with more if needed.</p>
                                      </div>
                                      <div class="fictrail-slider-container">
                                          <div class="fictrail-slider-track">
                                              <span class="fictrail-slider-min">1</span>
                                              <input type="range" id="fictrail-pages-slider" min="1" max="${MAX_PAGES_FETCH}" value="1" class="fictrail-slider">
                                              <span class="fictrail-slider-max">${MAX_PAGES_FETCH}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <button id="fictrail-load-btn" class="fictrail-btn">Reload History</button>
                              </div>
                          </footer>
                      </div>
                  </main>
              </div>
          </div>
      `;

  document.body.appendChild(overlay);

  // Add event listeners
  document.getElementById('fictrail-close').addEventListener('click', closeFicTrail);
  document.getElementById('fictrail-load-btn').addEventListener('click', reloadHistory);
  document.getElementById('fictrail-retry-btn').addEventListener('click', retryLastAction);
  document.getElementById('fictrail-search-input').addEventListener('input', debounce(performSearch, 300));
  document.getElementById('fictrail-fandom-filter').addEventListener('change', applyFilter);
  document.getElementById('fictrail-pages-slider').addEventListener('input', updatePagesValue);

  // Add click handler for tags
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('fictrail-tag-match')) {
      const tagValue = e.target.getAttribute('data-tag-value');
      const searchInput = document.getElementById('fictrail-search-input');
      searchInput.value = tagValue;
      performSearch();
    }
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeFicTrail();
  });
}

function openFicTrail() {
  document.getElementById('fictrail-overlay').style.display = 'block';
  document.body.style.overflow = 'hidden';

  // Only load data if we don't have any works yet
  if (allWorks.length === 0) {
    setTimeout(() => {
      loadFirstPage();
    }, 100);
  }
}

function closeFicTrail() {
  document.getElementById('fictrail-overlay').style.display = 'none';
  document.body.style.overflow = '';
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
    loadBtn.textContent = `Reload History (${currentPages} pages)`;
  }
}

function getPagesToLoad() {
  const slider = document.getElementById('fictrail-pages-slider');
  // If slider doesn't exist yet, default to 1 page
  if (!slider) return 1;
  return parseInt(slider.value);
}

function showSection(sectionId) {
  const sections = ['fictrail-loading-section', 'fictrail-error-section', 'fictrail-history-section'];
  sections.forEach(id => {
    document.getElementById(id).style.display = id === sectionId ? 'block' : 'none';
  });
}

function showLoading(message = 'Summoning your fic history...') {
  showSection('fictrail-loading-section');
  document.getElementById('fictrail-loading-status').textContent = message;
}

function showError(message) {
  showSection('fictrail-error-section');
  document.getElementById('fictrail-error-message').innerHTML = message;
}

function displayWorks(works) {
  const worksList = document.getElementById('fictrail-works-list');
  const noResults = document.getElementById('fictrail-no-results');

  if (works.length === 0) {
    worksList.style.display = 'none';
    noResults.style.display = 'block';
    // Remove existing narrow search message when there are no results
    const existingMessage = document.getElementById('fictrail-narrow-search-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    return;
  }

  worksList.style.display = 'grid';
  noResults.style.display = 'none';

  const maxResults = 20;
  const hasMoreResults = works.length > maxResults;
  const worksToShow = works.slice(0, maxResults);

  worksList.innerHTML = worksToShow.map((work, index) => `
          <div class="fictrail-work">
              <div class="fictrail-work-header">
                  <h3><a href="${work.url}" target="_blank" rel="noopener">${escapeHtml(work.title)}</a></h3>
                  <span class="fictrail-work-number">#${index + 1}</span>
              </div>
              <p class="fictrail-author">by ${work.authorUrl ? `<a href="${work.authorUrl}" target="_blank" rel="noopener">${escapeHtml(work.author)}</a>` : escapeHtml(work.author)}</p>
              ${work.fandoms.length > 0 ? `<p class="fictrail-fandoms">${work.fandoms.map(f => escapeHtml(f)).join(', ')}</p>` : ''}
              ${work.matchingTags && work.matchingTags.length > 0 ? `<div class="fictrail-matching-section">
                  <strong>Matching tags:</strong> ${work.matchingTags.map(tag => `<span class="fictrail-tag-match fictrail-tag-${tag.type}" title="${tag.type.charAt(0).toUpperCase() + tag.type.slice(1)} tag" data-tag-value="${escapeHtml(tag.value)}">${escapeHtml(tag.value)}</span>`).join('')}
              </div>` : ''}
              ${work.matchingSummary ? `<div class="fictrail-matching-section">
                  <strong>Matching summary:</strong> ${escapeHtml(work.matchingSummary)}
              </div>` : ''}
              <div class="fictrail-metadata">
                  ${work.words ? `<span>${escapeHtml(work.words)} words</span>` : ''}
                  ${work.chapters ? `<span>${escapeHtml(work.chapters)} chapters</span>` : ''}
                  ${work.publishDate ? `<span>Published: ${escapeHtml(work.publishDate)}</span>` : ''}
              </div>
              ${work.lastVisited ? `<p class="fictrail-last-visited">Last visited: ${escapeHtml(work.lastVisited)}</p>` : ''}
              ${work.summary && !work.matchingSummary ? `<div class="fictrail-summary">${escapeHtml(work.summary).replace(/\n/g, '<br>')}</div>` : ''}
          </div>
      `).join('');

  // Add message if there are more results
  if (hasMoreResults) {
    // Remove existing narrow search message if it exists
    const existingMessage = document.getElementById('fictrail-narrow-search-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create and insert message after the works list
    const messageDiv = document.createElement('div');
    messageDiv.id = 'fictrail-narrow-search-message';
    messageDiv.className = 'fictrail-narrow-search-message';
    messageDiv.innerHTML = `
              <p>Showing ${maxResults} of ${works.length} results. <strong>Narrow your search</strong> to see more specific matches.</p>
          `;

    // Insert after the works-list div
    worksList.parentNode.insertBefore(messageDiv, worksList.nextSibling);
  } else {
    // Remove message if no longer needed
    const existingMessage = document.getElementById('fictrail-narrow-search-message');
    if (existingMessage) {
      existingMessage.remove();
    }
  }
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

    // Create summary element
    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'fictrail-favorite-tags-summary';
    summaryDiv.className = 'fictrail-favorite-tags-summary';
    summaryDiv.innerHTML = `
              <p class="fictrail-summary-text">So you've been really into ${escapeHtml(mostPopularTag)} lately. Love it for you.</p>
          `;

    // Insert after header subtitle
    const headerSubtitle = document.getElementById('fictrail-subtitle');
    headerSubtitle.parentNode.insertBefore(summaryDiv, headerSubtitle.nextSibling);
  }
}
