// Scraper Module - AO3 history fetching and parsing

function scrapeHistoryFromPage(doc) {
  const works = [];
  const workItems = doc.querySelectorAll('ol.reading li.work');

  workItems.forEach((item) => {
    const titleLink = item.querySelector('h4.heading a[href*="/works/"]');
    const authorLink = item.querySelector('h4.heading a[rel="author"]');
    const fandomLinks = item.querySelectorAll('h5.fandoms a.tag');
    const lastVisitedEl = item.querySelector('h4.viewed.heading');
    const summaryEl = item.querySelector('.userstuff.summary');
    const statsEl = item.querySelector('.stats');
    const dateEl = item.querySelector('.datetime');
    const tagsEl = item.querySelector('.tags.commas');
    const seriesEl = item.querySelector('.series');

    // Extract required tags from the required-tags ul
    const requiredTagsEl = item.querySelector('.required-tags');

    // Extract rating
    const ratingSpan = requiredTagsEl?.querySelector('.rating');
    const ratingText = ratingSpan?.querySelector('.text')?.textContent.trim() || '';
    const ratingClass = ratingSpan?.className || '';

    // Extract warnings
    const warningSpans = requiredTagsEl?.querySelectorAll('.warnings') || [];
    const warnings = Array.from(warningSpans).flatMap(span => {
      const textEl = span.querySelector('.text');
      const text = textEl ? textEl.textContent.trim() : '';
      // Split by commas and clean up each warning
      return text ? text.split(',').map(w => w.trim()).filter(w => w) : [];
    });
    const warningClasses = Array.from(warningSpans).map(el => el.className);

    // Extract categories
    const categorySpans = requiredTagsEl?.querySelectorAll('.category') || [];
    const categories = Array.from(categorySpans).map(span => {
      const textEl = span.querySelector('.text');
      return textEl ? textEl.textContent.trim() : '';
    }).filter(c => c);
    const categoryClasses = Array.from(categorySpans).map(el => el.className);

    // Extract status (Complete/WIP)
    const statusSpan = requiredTagsEl?.querySelector('.iswip');
    const status = statusSpan?.querySelector('.text')?.textContent.trim() || '';
    const statusClass = statusSpan?.className || '';

    if (titleLink) {
      // Extract last visited date
      let lastVisited = '';
      if (lastVisitedEl) {
        const fullText = lastVisitedEl.textContent;
        const dateMatch = fullText.match(/Last visited:\s*([^(]+)/);
        if (dateMatch) {
          lastVisited = dateMatch[1].trim();
        }
      }

      // Extract stats
      const stats = {};
      if (statsEl) {
        stats.language = statsEl.querySelector('dd.language')?.textContent.trim() || '';
        stats.words = statsEl.querySelector('dd.words')?.textContent.trim() || '';
        stats.chapters = statsEl.querySelector('dd.chapters')?.textContent.trim() || '';
        stats.collections = statsEl.querySelector('dd.collections')?.textContent.trim() || '';
        stats.comments = statsEl.querySelector('dd.comments')?.textContent.trim() || '';
        stats.kudos = statsEl.querySelector('dd.kudos')?.textContent.trim() || '';
        stats.bookmarks = statsEl.querySelector('dd.bookmarks')?.textContent.trim() || '';
        stats.hits = statsEl.querySelector('dd.hits')?.textContent.trim() || '';
      }

      // Extract series information
      const series = [];
      if (seriesEl) {
        const seriesLinks = seriesEl.querySelectorAll('li');
        seriesLinks.forEach(li => {
          const seriesLink = li.querySelector('a[href*="/series/"]');
          const partMatch = li.textContent.match(/Part\s+(\d+)\s+of/);
          if (seriesLink && partMatch) {
            series.push({
              title: seriesLink.textContent.trim(),
              url: AO3_BASE_URL + seriesLink.getAttribute('href'),
              part: partMatch[1]
            });
          }
        });
      }

      const work = {
        title: titleLink.textContent.trim(),
        url: AO3_BASE_URL + titleLink.getAttribute('href'),
        author: authorLink ? authorLink.textContent.trim() : 'Anonymous',
        authorUrl: authorLink ? AO3_BASE_URL + authorLink.getAttribute('href') : null,
        fandoms: Array.from(fandomLinks).map(link => ({
          text: link.textContent.trim(),
          url: link.getAttribute('href')
        })),
        lastVisited: lastVisited,
        summary: summaryEl ? summaryEl.innerHTML : '',
        publishDate: dateEl ? dateEl.textContent.trim() : '',
        tags: tagsEl ? Array.from(tagsEl.querySelectorAll('a.tag')).map(tag => ({
          text: tag.textContent.trim(),
          url: tag.getAttribute('href')
        })) : [],
        relationships: tagsEl ? Array.from(tagsEl.querySelectorAll('.relationships a.tag')).map(rel => ({
          text: rel.textContent.trim(),
          url: rel.getAttribute('href')
        })) : [],
        characters: tagsEl ? Array.from(tagsEl.querySelectorAll('.characters a.tag')).map(char => ({
          text: char.textContent.trim(),
          url: char.getAttribute('href')
        })) : [],
        freeforms: tagsEl ? Array.from(tagsEl.querySelectorAll('.freeforms a.tag')).map(tag => ({
          text: tag.textContent.trim(),
          url: tag.getAttribute('href')
        })) : [],
        // Required tags with text and CSS classes
        rating: ratingText,
        ratingClass: ratingClass,
        warnings: warnings,
        warningClasses: warningClasses,
        categories: categories,
        categoryClasses: categoryClasses,
        status: status,
        statusClass: statusClass,
        // Stats and series
        stats: stats,
        series: series
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

    // Check logged-out state using shared helper
    if (isLoggedOutDoc(doc)) {
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

async function fetchMultiplePagesWithCache(username, maxPagesToFetch = MAX_PAGES_FETCH) {
  let totalPages = cachedTotalPages;
  const works = [];

  // Determine which pages we need to fetch
  const cachedPages = getMaxCachedPage();
  const startPage = isCacheValid() ? Math.max(1, cachedPages + 1) : 1;
  const endPage = Math.min(maxPagesToFetch, totalPages || MAX_PAGES_FETCH);

  // If we need to fetch page 1 or cache is invalid, start fresh
  if (startPage === 1 || !isCacheValid()) {
    console.log('Fetching fresh data starting from page 1');
    clearCache();

    try {
      const firstPageUrl = `${AO3_BASE_URL}/users/${username}/readings?page=1`;
      const response = await fetch(firstPageUrl);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      if (isLoggedOutDoc(doc)) {
        throw new Error('NOT_LOGGED_IN');
      }

      totalPages = getTotalPages(doc);
      cachedTotalPages = totalPages;
      cacheTimestamp = Date.now();

      const firstPageWorks = scrapeHistoryFromPage(doc);
      pageCache.set(1, { works: firstPageWorks, timestamp: Date.now() });
      works.push(...firstPageWorks);

      console.log(`Cached page 1 with ${firstPageWorks.length} works`);
    } catch (error) {
      console.error('Error fetching first page:', error);
      if (error.message === 'NOT_LOGGED_IN') {
        throw error;
      }
      return { works: [], totalPages: 1 };
    }
  } else {
    // Use existing cached data
    console.log(`Using cached data for pages 1-${cachedPages}`);
    for (let page = 1; page <= Math.min(cachedPages, maxPagesToFetch); page++) {
      if (pageCache.has(page)) {
        works.push(...pageCache.get(page).works);
      }
    }
  }

  // Fetch additional pages if needed
  const actualStartPage = Math.max(startPage, 2);
  const pagesToFetch = Math.min(maxPagesToFetch, totalPages || MAX_PAGES_FETCH);

  if (actualStartPage <= pagesToFetch) {
    console.log(`Fetching pages ${actualStartPage}-${pagesToFetch}`);

    for (let page = actualStartPage; page <= pagesToFetch; page++) {
      // Skip if we already have this page cached
      if (pageCache.has(page)) {
        console.log(`Page ${page} already cached, skipping`);
        continue;
      }

      showFicTrailLoading(`Loading page ${page} of ${pagesToFetch}...`);
      const pageWorks = await fetchHistoryPage(username, page);

      if (pageWorks.length > 0) {
        pageCache.set(page, { works: pageWorks, timestamp: Date.now() });
        works.push(...pageWorks);
        console.log(`Cached page ${page} with ${pageWorks.length} works`);
      }

      await new Promise(resolve => setTimeout(resolve, PAGE_FETCH_DELAY));
    }
  }

  console.log(`Total works loaded: ${works.length} from ${Math.min(maxPagesToFetch, totalPages || 1)} pages`);
  console.log(`Cache now contains ${pageCache.size} pages`);

  return { works: works, totalPages: totalPages || 1 };
}
