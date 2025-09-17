// Search Module - Search and filtering functionality
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
            matchingTags.push({ type: 'relationship', value: rel });
          }
        });
      }
      if (work.characters) {
        work.characters.forEach(char => {
          if (char.toLowerCase().includes(query)) {
            matchingTags.push({ type: 'character', value: char });
          }
        });
      }
      if (work.freeforms) {
        work.freeforms.forEach(tag => {
          if (tag.toLowerCase().includes(query)) {
            matchingTags.push({ type: 'freeform', value: tag });
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

function populateFandomFilter(works) {
  const fandomFilter = document.getElementById('fictrail-fandom-filter');
  const allFandoms = new Set();
  works.forEach(work => {
    work.fandoms.forEach(fandom => allFandoms.add(fandom));
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
