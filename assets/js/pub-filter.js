// This script was mostly generated using AI
(function () {
  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function norm(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function init() {
    // Find the markers for this page
    const markers = document.querySelectorAll('.publist-marker');
    if (!markers.length) return;

    markers.forEach(initForMarker);
  }

  function initForMarker(marker) {

    // Find the first <ol> after the marker
    let ol = marker.nextElementSibling;
    while (ol && ol.tagName !== 'OL') ol = ol.nextElementSibling;
    if (!ol) return;

    // Build UI container
    const wrap = document.createElement('div');
    wrap.id = 'pub-filter-wrap';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Filter publications');
    wrap.style.cssText = [
      'margin:1rem 0 1.25rem 0',
      'padding:.75rem',
      'border:1px solid #d0d7de',
      'border-radius:.5rem',
      'background:#fff'
    ].join(';');

    wrap.innerHTML = `
      <label>
        Filter publications
      </label>
      <input class="pub-filter" type="search" inputmode="search"
             placeholder="Type author, title, venue, DOI, or year…"
             aria-label="Filter publications"
             style="width:100%;max-width:720px;padding:.6rem .75rem;border:1px solid #d0d7de;border-radius:.5rem;">
        <button class="pub-clear" type="button" title="Clear filters"
                style="margin-left:auto;padding:.35rem .6rem;border:1px solid #d0d7de;background:#f6f8fa;border-radius:.35rem;cursor:pointer;">
          Clear
        </button>
      <div class="pub-stats" aria-live="polite" style="margin-top:.5rem;color:#555;font-size:.95rem;"></div>
    `;

    // Insert UI before the list
    ol.parentNode.insertBefore(wrap, ol);

    // Cache references
    const input = wrap.querySelector('.pub-filter');
    const clearBtn = wrap.querySelector('.pub-clear');
    const stats = wrap.querySelector('.pub-stats');

    // Build rows cache
    const lis = Array.from(ol.querySelectorAll(':scope > li'));
    if (!lis.length) return;

    const rows = lis.map(li => {
      const text = li.textContent.trim();
      const textN = norm(text);
      const doiLink = li.querySelector('a[href*="doi.org"]');
      const doiN = doiLink ? norm(doiLink.href) : '';
      return { li, textN, doiN };
    });

    // "No results" placeholder
    const emptyRow = document.createElement('li');
    emptyRow.textContent = 'No matching publications.';
    emptyRow.style.display = 'none';
    ol.appendChild(emptyRow);

    function renderStats(shown, total) {
      const parts = [`${shown} of ${total} shown`];
      const q = input.value.trim();
      if (q) parts.push(`query: "${q}"`);
      stats.textContent = parts.join(' — ');
    }

    function applyFilter() {
      const q = norm(input.value.trim());
      const terms = q.split(/\s+/).filter(Boolean);

      let shown = 0;
      for (const r of rows) {
        // Text/DOI match (AND across terms)
        const hay = r.textN + ' ' + r.doiN;
        const match = terms.length === 0 || terms.every(t => hay.includes(t));
        r.li.style.display = match ? '' : 'none';
        if (match) shown++;
      }

      emptyRow.style.display = shown === 0 ? '' : 'none';
      renderStats(shown, rows.length);
    }

    // Wire events
    input.addEventListener('input', applyFilter);
    clearBtn.addEventListener('click', () => {
      input.value = '';
      applyFilter();
      input.focus();
    });

    // Initial stats
    renderStats(rows.length, rows.length);
  }
})();
