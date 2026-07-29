import { getAEMPublish, getAEMAuthor } from '../../scripts/endpointconfig.js';

const PERSISTED_QUERY = '/graphql/execute.json/securbank/navByPath';

/**
 * Build a <ul> from a rich-text "unordered-list" node of the CF JSON.
 * Each list-item is either a leaf link, or a link plus a nested unordered-list
 * (an accordion group).
 */
function buildList(listNode) {
  const ul = document.createElement('ul');
  (listNode.content || []).forEach((li) => {
    if (li.nodeType !== 'list-item') return;
    const link = (li.content || []).find((n) => n.nodeType === 'link');
    const sublist = (li.content || []).find((n) => n.nodeType === 'unordered-list');
    const label = (link?.content || []).map((t) => t.value || '').join('').trim();
    const href = link?.data?.href || '';
    const item = document.createElement('li');

    if (sublist) {
      item.className = 'nav-group';
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nav-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', `Toggle ${label}`);

      const labelEl = document.createElement('a');
      labelEl.className = 'nav-group-label';
      labelEl.href = href;
      labelEl.textContent = label;

      const submenu = buildList(sublist);
      submenu.className = 'nav-submenu';

      item.append(toggle, labelEl, submenu);
    } else {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      item.append(a);
    }
    ul.append(item);
  });
  return ul;
}

/**
 * Accordion behaviour: only one group open at a time, and auto-open the group
 * containing the current page (with the active link marked).
 */
function wireAccordion(nav) {
  const groups = [...nav.querySelectorAll('.nav-group')];

  const openGroup = (group, open) => {
    group.classList.toggle('open', open);
    group.querySelector(':scope > .nav-toggle')?.setAttribute('aria-expanded', String(open));
  };

  groups.forEach((group) => {
    const toggle = group.querySelector(':scope > .nav-toggle');
    toggle.addEventListener('click', () => {
      const willOpen = !group.classList.contains('open');
      groups.forEach((g) => openGroup(g, false));
      openGroup(group, willOpen);
    });
  });

  // Auto-open the group containing the current page; mark the active link.
  const here = window.location.pathname.replace(/\/+$/, '');
  nav.querySelectorAll('a[href]').forEach((a) => {
    const path = new URL(a.href, window.location.origin).pathname.replace(/\/+$/, '');
    if (path && path === here) {
      a.setAttribute('aria-current', 'page');
      a.classList.add('active');
      const group = a.closest('.nav-group');
      if (group) openGroup(group, true);
    }
  });
}

export default async function decorate(block) {
  const navpath = (block.querySelector('a')?.textContent || block.textContent || '').trim();
  if (!navpath) {
    block.innerHTML = '';
    return;
  }

  const base = window.location?.origin?.includes('author') ? getAEMAuthor() : getAEMPublish();
  const url = `${base}${PERSISTED_QUERY};path=${navpath};ts=${Math.floor(Math.random() * 1000)}`;

  let json;
  try {
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();
    json = data?.data?.navByPath?.item?.nav?.json;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('failed to load nav content fragment', e);
  }
  if (!Array.isArray(json)) {
    block.innerHTML = '';
    return;
  }

  const nav = document.createElement('nav');
  nav.className = 'nav-accordion';
  nav.setAttribute('aria-label', 'Section navigation');
  json
    .filter((n) => n.nodeType === 'unordered-list')
    .forEach((list) => nav.append(buildList(list)));

  wireAccordion(nav);
  block.replaceChildren(nav);
}
