const DEFAULT_INDEX = '/query-index.json';

/** Load the query index, keeping only real pages (have a title, not noindex). */
async function fetchIndex(source) {
  try {
    const res = await fetch(source);
    const json = await res.json();
    return (json.data || []).filter(
      (row) => row.title && !(row.robots || '').toLowerCase().includes('noindex'),
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('failed to load search index', e);
    return [];
  }
}

/** Rank rows by a case-insensitive term match (title weighted over description). */
function match(index, term) {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  return index
    .map((row) => {
      let score = 0;
      if ((row.title || '').toLowerCase().includes(t)) score += 2;
      if ((row.description || '').toLowerCase().includes(t)) score += 1;
      return { row, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.row);
}

function renderResults(container, rows, term) {
  container.textContent = '';
  if (!term.trim()) return;
  if (!rows.length) {
    const empty = document.createElement('p');
    empty.className = 'search-empty';
    empty.textContent = `No results for “${term.trim()}”.`;
    container.append(empty);
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'search-results-list';
  rows.forEach((row) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = row.path;
    a.className = 'search-result-title';
    a.textContent = row.title;
    li.append(a);
    if (row.description) {
      const p = document.createElement('p');
      p.className = 'search-result-desc';
      p.textContent = row.description;
      li.append(p);
    }
    ul.append(li);
  });
  container.append(ul);
}

export default async function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const placeholder = (cells[0]?.textContent || '').trim() || 'Search';
  const source = (cells[1]?.textContent || '').trim() || DEFAULT_INDEX;

  block.textContent = '';

  const form = document.createElement('form');
  form.className = 'search-form';
  form.setAttribute('role', 'search');

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'search-input';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'search-button';
  button.textContent = 'Search';

  form.append(input, button);

  const results = document.createElement('div');
  results.className = 'search-results';

  block.append(form, results);

  const index = await fetchIndex(source);
  const run = (term) => renderResults(results, match(index, term), term);

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => run(input.value), 200);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run(input.value);
    const url = new URL(window.location.href);
    if (input.value.trim()) url.searchParams.set('q', input.value.trim());
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
  });

  // Deep-link support: /en/search?q=term
  const q = new URLSearchParams(window.location.search).get('q');
  if (q) {
    input.value = q;
    run(q);
  }
}
