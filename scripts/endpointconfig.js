import { fetchPlaceholders } from './aem.js';

const DEFAULT_PNE = 'p130746-e1275972';

async function getAemPneFromPlaceholders(prefix) {
  const placeholders = await fetchPlaceholders(prefix);
  return placeholders.aemPne || DEFAULT_PNE;
}

/**
 * Resolves publish URL from placeholders aem-pne (e.g. publish-<aem-pne>.adobeaemcloud.com), or default.
 * @param {string} [prefix=''] Placeholders path prefix (same as fetchPlaceholders).
 * @returns {Promise<string>} Publish base URL.
 */
async function getAEMPublish(prefix = '') {
  const aemPne = await getAemPneFromPlaceholders(prefix);
  return `https://publish-${aemPne}.adobeaemcloud.com`;
}

/**
 * Resolves author URL from placeholders aem-pne (e.g. author-<aem-pne>.adobeaemcloud.com), or default.
 * @param {string} [prefix=''] Placeholders path prefix (same as fetchPlaceholders).
 * @returns {Promise<string>} Author base URL.
 */
async function getAEMAuthor(prefix = '') {
  const aemPne = await getAemPneFromPlaceholders(prefix);
  return `https://author-${aemPne}.adobeaemcloud.com`;
}

export { getAEMPublish, getAEMAuthor };
