// Content script for FicTrail extension

// Constants
const AO3_BASE_URL = 'https://archiveofourown.org';

// Function to get username from the current page
function getUsername() {
  // Try to get username from greeting nav
  const greetingLink = document.querySelector('#greeting .user a[href*="/users/"]');
  if (greetingLink) {
    const href = greetingLink.getAttribute('href');
    const match = href.match(/\/users\/([^/]+)/);
    return match ? match[1] : null;
  }
  return null;
}

// Function to scrape history from a readings page
function scrapeHistoryFromPage(doc) {
  const works = [];
  const workItems = doc.querySelectorAll('ol.reading li.work');

  workItems.forEach((item, _index) => {
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

// Function to fetch a specific page of history
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

// Function to get the total number of pages available
function getTotalPages(doc = document) {
  const pagination = doc.querySelector('.pagination');
  if (!pagination) return 1;

  // Look for the last page number in pagination
  const pageLinks = pagination.querySelectorAll('a');
  let maxPage = 1;

  pageLinks.forEach(link => {
    const pageNum = parseInt(link.textContent.trim());
    if (!isNaN(pageNum) && pageNum > maxPage) {
      maxPage = pageNum;
    }
  });

  // Also check if there's a "Next" link to ensure we're not on the last page
  const nextLink = pagination.querySelector('a[rel="next"]');
  if (nextLink && maxPage === 1) {
    // If we found a next link but no page numbers, there are at least 2 pages
    maxPage = 2;
  }

  return maxPage;
}

// Function to fetch multiple pages of history
async function fetchMultiplePages(username, maxPagesToFetch = 10) {

  // First, fetch the first page to determine total pages
  let totalPages;
  try {
    const firstPageUrl = `${AO3_BASE_URL}/users/${username}/readings?page=1`;
    const response = await fetch(firstPageUrl);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    totalPages = getTotalPages(doc);
  } catch (error) {
    console.error('Error fetching first page to determine total pages:', error);
    return [];
  }

  // Calculate which pages to fetch - fetch exactly the requested number
  const pagesToFetch = Math.min(maxPagesToFetch, totalPages);
  const startPage = 1;
  const endPage = pagesToFetch;


  const allWorks = [];

  // Fetch all pages
  for (let page = startPage; page <= endPage; page++) {
    const works = await fetchHistoryPage(username, page);
    allWorks.push(...works);

    // Add a small delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { works: allWorks, totalPages: totalPages };
}

// Function to handle messages from popup/extension page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === 'getUsername') {
    // Just return the username if logged in
    const username = getUsername();

    if (username) {
      sendResponse({ username });
    } else {
      sendResponse({ error: 'Not logged in' });
    }
    return true;
  }

  if (message.action === 'getTotalPages') {
    // Get total pages without fetching full history
    const username = getUsername();
    if (!username) {
      sendResponse({ error: 'Not logged in' });
      return true;
    }

    // Fetch just the first page to get total page count
    fetch(`${AO3_BASE_URL}/users/${username}/readings?page=1`)
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const totalPages = getTotalPages(doc);
        sendResponse({ totalPages });
      })
      .catch(error => {
        console.error('Error getting total pages:', error);
        sendResponse({ error: 'Failed to get total pages' });
      });

    return true; // Keep the message channel open for async response
  }

  if (message.action === 'getHistory') {
    // Since this content script only runs on AO3 pages (per manifest),
    // we know we're on AO3 if we get here
    const username = getUsername();

    if (!username) {
      sendResponse({
        error: 'Could not find username. Make sure you are logged in to AO3.',
        needsLogin: true,
        loginUrl: `${AO3_BASE_URL}/users/login`
      });
      return true;
    }

    // Get maxPages from message, default to 10 if not specified
    const maxPages = message.maxPages || 10;

    // Use async function to handle the response
    (async () => {
      try {
        const result = await fetchMultiplePages(username, maxPages);
        sendResponse({
          works: result.works,
          username,
          totalWorks: result.works.length,
          totalPages: result.totalPages
        });
      } catch (error) {
        console.error('Error fetching history:', error);
        sendResponse({ error: 'An error occurred while fetching your history. Please try again.' });
      }
    })();

    return true; // Keep the message channel open for async response
  }
});
