// Search Module - Search and filtering functionality
function performSearch() {
  const query = document.getElementById('fictrail-search-input').value.toLowerCase().trim();

  if (query === '') {
    filteredWorks = [...allWorks];
    filteredWorks.forEach(work => {
      work.matchingTags = [];
    });
    // Apply filter which will show the count
    applyFilter();
    return;
  } else {
    filteredWorks = allWorks.filter(work => {
      const matchingTags = [];

      if (work.relationships) {
        work.relationships.forEach(rel => {
          if (rel.text.toLowerCase().includes(query)) {
            matchingTags.push({
              type: 'relationship',
              value: rel.text,
              url: rel.url
            });
          }
        });
      }
      if (work.characters) {
        work.characters.forEach(char => {
          if (char.text.toLowerCase().includes(query)) {
            matchingTags.push({
              type: 'character',
              value: char.text,
              url: char.url
            });
          }
        });
      }
      if (work.freeforms) {
        work.freeforms.forEach(tag => {
          if (tag.text.toLowerCase().includes(query)) {
            matchingTags.push({
              type: 'freeform',
              value: tag.text,
              url: tag.url
            });
          }
        });
      }


      work.matchingTags = matchingTags;

      // Extract text from HTML summary for searching
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = work.summary || '';
      const summaryText = tempDiv.textContent || tempDiv.innerText || '';

      return work.title.toLowerCase().includes(query) ||
                     work.author.toLowerCase().includes(query) ||
                     work.fandoms.some(fandom => fandom.text.toLowerCase().includes(query)) ||
                     summaryText.toLowerCase().includes(query) ||
                     matchingTags.length > 0 ||
                     (work.tags && work.tags.some(tag => tag.text.toLowerCase().includes(query)));
    });
  }

  applyFilter();
}

function applyFilter() {
  const selectedFandom = document.getElementById('fictrail-fandom-filter').value;

  let worksToDisplay = [...filteredWorks];
  if (selectedFandom) {
    worksToDisplay = worksToDisplay.filter(work =>
      work.fandoms.some(fandom => fandom.text === selectedFandom)
    );
  }

  worksToDisplay.sort((a, b) => {
    if (a.lastVisited && b.lastVisited) {
      return new Date(b.lastVisited) - new Date(a.lastVisited);
    }
    return 0;
  });

  // Reset pagination for new search/filter
  currentDisplayCount = ITEMS_PER_PAGE;

  // Show results count
  updateResultsCount(worksToDisplay.length);
  displayWorks(worksToDisplay);
}

function updateResultsCount(count) {
  const resultsCountElement = document.getElementById('fictrail-results-count');
  if (resultsCountElement) {
    if (count > 0) {
      resultsCountElement.textContent = `${count} result${count === 1 ? '' : 's'}`;
      resultsCountElement.style.display = 'block';
    } else {
      resultsCountElement.style.display = 'none';
    }
  }
}

function populateFandomFilter(works) {
  const fandomFilter = document.getElementById('fictrail-fandom-filter');
  const allFandoms = new Set();
  works.forEach(work => {
    work.fandoms.forEach(fandom => {
      allFandoms.add(fandom.text);
    });
  });

  const sortedFandoms = Array.from(allFandoms).sort((a, b) => a.localeCompare(b));
  fandomFilter.innerHTML = '<option value="">All Fandoms</option>';

  sortedFandoms.forEach(fandom => {
    const option = document.createElement('option');
    option.value = fandom;
    option.textContent = fandom;
    fandomFilter.appendChild(option);
  });
}
