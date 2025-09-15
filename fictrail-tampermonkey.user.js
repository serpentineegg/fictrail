// ==UserScript==
// @name         FicTrail - AO3 History Viewer
// @namespace    https://github.com/serpentineegg/fictrail
// @version      0.1.0
// @description  AO3 history search and filtering tool
// @author       serpentineegg
// @match        *://archiveofourown.org/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        window.close
// @run-at       document-idle
// ==/UserScript==

/* global GM_addStyle */

(function() {
  'use strict';

  // Constants
  const AO3_BASE_URL = 'https://archiveofourown.org';

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

  // Add CSS styles
  GM_addStyle(`
        /* FicTrail Styles */
        #fictrail-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: none;
        }
        
        #fictrail-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 95%;
            max-width: 1200px;
            min-width: 800px;
            height: 90%;
            background: #f8fafc;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        #fictrail-close {
            background: rgba(0, 0, 0, 0.1);
            color: #4a5568;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        
        #fictrail-close:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
        }
        
        #fictrail-header-main {
            flex: 1;
        }
        
        #fictrail-content {
            padding: 0;
            overflow-y: auto;
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
        }
        
        .fictrail-header {
            padding: 24px 40px 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 32px;
        }
        
        
        .fictrail-header h1 {
            font-size: 2em;
            font-weight: 300;
            color: #2d3748;
            margin: 0 0 3px 0;
        }
        
        .fictrail-header p {
            font-size: 1em;
            color: #718096;
            margin: 0;
        }
        
        .fictrail-main {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }
        
        .fictrail-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .fictrail-btn:hover {
            background: #2563eb;
        }
        
        .fictrail-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            opacity: 0.6;
        }
        
        .fictrail-btn:disabled:hover {
            background: #9ca3af;
        }
        
        .fictrail-btn-secondary {
            background: white;
            color: #4a5568;
            border: 2px solid #e2e8f0;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        }
        
        .fictrail-loading {
            padding: 80px 40px;
            text-align: center;
        }
        
        .fictrail-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: fictrail-spin 1s linear infinite;
            margin: 0 auto 32px;
        }
        
        @keyframes fictrail-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .fictrail-error {
            padding: 80px 40px;
            text-align: center;
        }
        
        .fictrail-error h2 {
            font-size: 2.2em;
            font-weight: 300;
            color: #e53e3e;
            margin-bottom: 24px;
        }
        
        .fictrail-history {
            padding: 48px 40px;
        }
        
        .fictrail-controls {
            display: flex;
            gap: 20px;
            align-items: flex-end;
            flex-wrap: wrap;
            margin-bottom: 32px;
        }
        
        .fictrail-search {
            flex: 1;
            min-width: 300px;
        }
        
        .fictrail-search input {
            width: 100%;
            padding: 10px 15px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            outline: none;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            -moz-box-shadow: none !important;
        }
        
        .fictrail-filter select {
            padding: 10px 15px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            background: white;
            font-size: 14px;
            cursor: pointer;
            outline: none;
            width: 200px;
        }
        
        .fictrail-works {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }
        
        .fictrail-work {
            background: white;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
        }
        
        .fictrail-work:hover {
            border-color: #cbd5e0;
        }
        
        .fictrail-work-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        
        .fictrail-work h3 {
            margin: 0;
            font-size: 1.1em;
            line-height: 1.4;
            flex: 1;
            margin-right: 15px;
        }
        
        .fictrail-work h3 a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 600;
            border-bottom: 1px solid transparent;
            transition: all 0.2s ease;
        }
        
        .fictrail-work h3 a:hover {
            color: #2563eb;
            border-bottom-color: #3b82f6;
            text-decoration: none !important;
        }
        
        .fictrail-work-number {
            background: #3b82f6;
            color: white;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .fictrail-author {
            color: #4a5568;
            font-style: italic;
            margin-bottom: 6px;
            font-weight: 500;
        }
        
        .fictrail-author a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 600;
        }
        
        .fictrail-fandoms {
            color: #38a169;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 0.9em;
        }
        
        .fictrail-metadata {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 12px;
        }
        
        .fictrail-metadata span {
            background: #edf2f7;
            color: #4a5568;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .fictrail-last-visited {
            color: #718096;
            font-size: 12px;
            margin: 12px 0;
            font-weight: 500;
        }
        
        .fictrail-summary {
            color: #718096;
            font-size: 14px;
            line-height: 1.4;
            margin: 8px 0 0 0;
        }
        
        .fictrail-matching-section {
            margin: 12px 0;
            padding: 12px;
            background: #f0f9ff;
            border-radius: 6px;
            border: 1px solid #bae6fd;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .fictrail-tag-match {
            display: inline-block;
            padding: 2px 6px;
            margin: 2px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
        }
        
        .fictrail-tag-relationship {
            background: #fef3c7;
            color: #d97706;
            border: 1px solid #fed7aa;
        }
        
        .fictrail-tag-character {
            background: #dcfce7;
            color: #16a34a;
            border: 1px solid #bbf7d0;
        }
        
        .fictrail-tag-freeform {
            background: #e0e7ff;
            color: #4338ca;
            border: 1px solid #c7d2fe;
        }
        
        .fictrail-no-results {
            padding: 80px 40px;
            text-align: center;
        }
        
        .fictrail-no-results h3 {
            font-size: 1.8em;
            font-weight: 300;
            margin-bottom: 16px;
            color: #4a5568;
        }
        
        .fictrail-narrow-search-message {
            margin-top: 20px;
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        
        .fictrail-narrow-search-message p {
            margin: 0;
            color: #92400e;
            font-size: 0.9em;
        }
        
        .fictrail-favorite-tags-summary {
            margin: 10px 0 5px 0;
        }
        
        .fictrail-summary-text {
            color: #718096;
            font-size: 10px;
            font-style: italic;
            margin: 0;
            line-height: 1.5;
        }
        
        .fictrail-page-selector {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .fictrail-page-selector-header {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .fictrail-page-selector label {
            font-size: 14px;
            font-weight: 600;
            color: #4a5568;
        }
        
        .fictrail-info-tooltip {
            cursor: help;
            font-size: 14px;
            color: #718096;
            transition: color 0.2s ease;
        }
        
        .fictrail-info-tooltip:hover {
            color: #4a5568;
        }
        
        .fictrail-slider-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .fictrail-slider-track {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .fictrail-slider-min,
        .fictrail-slider-max {
            font-size: 12px;
            color: #718096;
            font-weight: 500;
            min-width: 20px;
            text-align: center;
        }
        
        .fictrail-slider {
            width: 200px;
            height: 6px;
            border-radius: 3px;
            background: #e2e8f0;
            outline: none;
            -webkit-appearance: none;
            appearance: none;
        }
        
        .fictrail-slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .fictrail-slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
    `);

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
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
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
                            <div class="fictrail-page-selector" id="fictrail-page-selector" style="display: none;">
                                <div class="fictrail-page-selector-header">
                                    <label for="fictrail-pages-slider">Pages to load</label>
                                    <span class="fictrail-info-tooltip" title="Loading many pages can take a long time and use significant computer resources. Start with fewer pages for better performance.">ℹ️</span>
                                </div>
                                <div class="fictrail-slider-container">
                                    <div class="fictrail-slider-track">
                                        <span class="fictrail-slider-min">1</span>
                                        <input type="range" id="fictrail-pages-slider" min="1" max="50" value="10" class="fictrail-slider">
                                        <span class="fictrail-slider-max">50</span>
                                    </div>
                                </div>
                            </div>
                            <button id="fictrail-load-btn" class="fictrail-btn">Load My History</button>
                        </div>
                        <div id="fictrail-close-btn">
                            <button id="fictrail-close">×</button>
                        </div>
                    </header>
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;">
                    
                    <main class="fictrail-main">
                        <div id="fictrail-welcome" class="fictrail-loading">
                            <h2>Ready to explore?</h2>
                            <p>Click "Load My History" and let's go!</p>
                        </div>
                        
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
                                <h3>404: Fics Not Found</h3>
                                <p>Your search came up empty! Try different keywords or maybe you haven't read that trope yet? 👀</p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        `;

    document.body.appendChild(overlay);

    // Add event listeners
    document.getElementById('fictrail-close').addEventListener('click', closeFicTrail);
    document.getElementById('fictrail-load-btn').addEventListener('click', loadHistory);
    document.getElementById('fictrail-retry-btn').addEventListener('click', loadHistory);
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

  let allWorks = [];
  let filteredWorks = [];

  function openFicTrail() {
    document.getElementById('fictrail-overlay').style.display = 'block';
    document.body.style.overflow = 'hidden';
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
    const pageSelector = document.getElementById('fictrail-page-selector');
    const loadBtn = document.getElementById('fictrail-load-btn');

    // Check if we're in reload mode (history has been loaded)
    if (pageSelector.style.display !== 'none' && pageSelector.style.display !== '') {
      loadBtn.textContent = `Reload History (${currentPages} pages)`;
    }
  }

  function getPagesToLoad() {
    return parseInt(document.getElementById('fictrail-pages-slider').value);
  }

  function showSection(sectionId) {
    const sections = ['fictrail-welcome', 'fictrail-loading-section', 'fictrail-error-section', 'fictrail-history-section'];
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

  // History scraping functions (adapted from content.js)
  function scrapeHistoryFromPage(doc) {
    const works = [];
    const workItems = doc.querySelectorAll('ol.reading li.work');

    workItems.forEach((item) => {
      const titleLink = item.querySelector('h4.heading a[href*="/works/"]');
      const authorLink = item.querySelector('h4.heading a[rel="author"]');
      const fandomLinks = item.querySelectorAll('h5.fandoms a.tag');
      const lastVisited = item.querySelector('.viewed .text, .viewed span');
      const summaryEl = item.querySelector('.userstuff.summary');
      const wordsEl = item.querySelector('.stats dd.words');
      const chaptersEl = item.querySelector('.stats dd.chapters');
      const dateEl = item.querySelector('.datetime');
      const tagsEl = item.querySelector('.tags.commas');

      if (titleLink) {
        const work = {
          title: titleLink.textContent.trim(),
          url: AO3_BASE_URL + titleLink.getAttribute('href'),
          author: authorLink ? authorLink.textContent.trim() : 'Anonymous',
          authorUrl: authorLink ? AO3_BASE_URL + authorLink.getAttribute('href') : null,
          fandoms: Array.from(fandomLinks).map(link => link.textContent.trim()),
          lastVisited: lastVisited ? lastVisited.textContent.replace(/Last visited:\s*/, '').trim() : '',
          summary: summaryEl ? summaryEl.textContent.trim() : '',
          words: wordsEl ? wordsEl.textContent.trim() : '',
          chapters: chaptersEl ? chaptersEl.textContent.trim() : '',
          publishDate: dateEl ? dateEl.textContent.trim() : '',
          tags: tagsEl ? Array.from(tagsEl.querySelectorAll('a.tag')).map(tag => tag.textContent.trim()) : [],
          relationships: tagsEl ? Array.from(tagsEl.querySelectorAll('.relationships a.tag')).map(rel => rel.textContent.trim()) : [],
          characters: tagsEl ? Array.from(tagsEl.querySelectorAll('.characters a.tag')).map(char => char.textContent.trim()) : [],
          freeforms: tagsEl ? Array.from(tagsEl.querySelectorAll('.freeforms a.tag')).map(tag => tag.textContent.trim()) : []
        };
        works.push(work);
      }
    });

    return works;
  }

  async function fetchHistoryPage(username, page = 1) {
    const url = `${AO3_BASE_URL}/users/${username}/readings?page=${page}`;

    try {
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return scrapeHistoryFromPage(doc);
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      return [];
    }
  }

  function getTotalPages(doc = document) {
    const pagination = doc.querySelector('.pagination');
    if (!pagination) return 1;

    const pageLinks = pagination.querySelectorAll('a');
    let maxPage = 1;

    pageLinks.forEach(link => {
      const pageNum = parseInt(link.textContent.trim());
      if (!isNaN(pageNum) && pageNum > maxPage) {
        maxPage = pageNum;
      }
    });

    const nextLink = pagination.querySelector('a[rel="next"]');
    if (nextLink && maxPage === 1) {
      maxPage = 2;
    }

    return maxPage;
  }

  async function fetchMultiplePages(username, maxPagesToFetch = 10) {
    let totalPages;
    try {
      const firstPageUrl = `${AO3_BASE_URL}/users/${username}/readings?page=1`;
      const response = await fetch(firstPageUrl);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      totalPages = getTotalPages(doc);
    } catch (error) {
      console.error('Error fetching first page:', error);
      return { works: [], totalPages: 1 };
    }

    const pagesToFetch = Math.min(maxPagesToFetch, totalPages);
    const allWorks = [];

    for (let page = 1; page <= pagesToFetch; page++) {
      showLoading(`Loading page ${page} of ${pagesToFetch}...`);
      const works = await fetchHistoryPage(username, page);
      allWorks.push(...works);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { works: allWorks, totalPages: totalPages };
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

  function populateFandomFilter(works) {
    const fandomFilter = document.getElementById('fictrail-fandom-filter');
    const allFandoms = new Set();
    works.forEach(work => {
      work.fandoms.forEach(fandom => allFandoms.add(fandom));
    });

    const sortedFandoms = Array.from(allFandoms).sort();
    fandomFilter.innerHTML = '<option value="">All Fandoms</option>';

    sortedFandoms.forEach(fandom => {
      const option = document.createElement('option');
      option.value = fandom;
      option.textContent = fandom;
      fandomFilter.appendChild(option);
    });
  }

  function performSearch() {
    const query = document.getElementById('fictrail-search-input').value.toLowerCase().trim();

    if (query === '') {
      filteredWorks = [...allWorks];
      filteredWorks.forEach(work => {
        work.matchingTags = [];
        work.matchingSummary = null;
      });
    } else {
      filteredWorks = allWorks.filter(work => {
        const matchingTags = [];
        let matchingSummary = null;

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

        // Check for summary match and extract fragment
        if (work.summary && work.summary.toLowerCase().includes(query)) {
          const summaryLower = work.summary.toLowerCase();
          const queryIndex = summaryLower.indexOf(query);
          const start = Math.max(0, queryIndex - 50);
          const end = Math.min(work.summary.length, queryIndex + query.length + 50);
          let fragment = work.summary.substring(start, end);
          
          if (start > 0) fragment = '...' + fragment;
          if (end < work.summary.length) fragment = fragment + '...';
          
          matchingSummary = fragment;
        }

        work.matchingTags = matchingTags;
        work.matchingSummary = matchingSummary;

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
    const selectedFandom = document.getElementById('fictrail-fandom-filter').value;

    let worksToDisplay = [...filteredWorks];
    if (selectedFandom) {
      worksToDisplay = worksToDisplay.filter(work =>
        work.fandoms.includes(selectedFandom)
      );
    }

    worksToDisplay.sort((a, b) => {
      if (a.lastVisited && b.lastVisited) {
        return new Date(b.lastVisited) - new Date(a.lastVisited);
      }
      return 0;
    });

    displayWorks(worksToDisplay);
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
                ${work.summary && !work.matchingSummary ? `<p class="fictrail-summary">${escapeHtml(work.summary.substring(0, 300))}${work.summary.length > 300 ? '...' : ''}</p>` : ''}
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

  // Initialize when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    createFicTrailButton();
    createOverlay();
  }

})();
