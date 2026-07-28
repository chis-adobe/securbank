import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// language roots available on this site; used to scope nav/footer fragments
const LANGS = ['en', 'fr'];

/**
 * resolves the current language root from the URL, defaulting to 'en'
 * e.g. /fr/creditcards -> 'fr', / or /creditcards -> 'en'
 * @returns {string} the language segment
 */
function getLangRoot() {
  const [, maybeLang] = window.location.pathname.split('/');
  return LANGS.includes(maybeLang) ? maybeLang : 'en';
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  block.textContent = '';

  // load footer fragment for the current language root (default: en)
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : `/${getLangRoot()}/footer`;
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
