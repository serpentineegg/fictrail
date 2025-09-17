// Scraper Module - AO3 history fetching and parsing

// Safely extract text content while preserving line breaks from HTML elements
function extractTextWithLineBreaks(element) {
  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true);

  // Replace block elements with newlines
  const blockElements = clone.querySelectorAll('p, div, br');
  blockElements.forEach(el => {
    if (el.tagName === 'BR') {
      el.replaceWith('\n');
    } else {
      // Add newline after block elements
      el.insertAdjacentText('afterend', '\n');
    }
  });

  // Get text content and clean up extra whitespace
  return clone.textContent.replace(/\n\s*\n/g, '\n').trim();
}

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
        summary: summaryEl ? extractTextWithLineBreaks(summaryEl) : '',
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

    // Check if user is actually logged in by looking for login indicators
    const loginLink = doc.querySelector('a[href*="/users/login"]');
    const loggedOutMessage = doc.querySelector('.flash.notice');
    if (loginLink || (loggedOutMessage && loggedOutMessage.textContent.includes('log in'))) {
      throw new Error('NOT_LOGGED_IN');
    }

    return scrapeHistoryFromPage(doc);
  } catch (error) {
    console.error(`Error fetching page ${page}:`, error);
    if (error.message === 'NOT_LOGGED_IN') {
      throw error;
    }
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

async function fetchMultiplePages(username, maxPagesToFetch = MAX_PAGES_FETCH) {
  let totalPages;
  let firstPageWorks = [];

  try {
    const firstPageUrl = `${AO3_BASE_URL}/users/${username}/readings?page=1`;
    const response = await fetch(firstPageUrl);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    totalPages = getTotalPages(doc);
    firstPageWorks = scrapeHistoryFromPage(doc);
  } catch (error) {
    console.error('Error fetching first page:', error);
    return { works: [], totalPages: 1 };
  }

  const pagesToFetch = Math.min(maxPagesToFetch, totalPages);
  const works = [...firstPageWorks];

  // Start from page 2 since we already have page 1
  for (let page = 2; page <= pagesToFetch; page++) {
    showLoading(`Loading page ${page} of ${pagesToFetch}...`);
    const pageWorks = await fetchHistoryPage(username, page);
    works.push(...pageWorks);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { works: works, totalPages: totalPages };
}
