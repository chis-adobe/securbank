import { loadCSS } from '../../scripts/aem.js';
import decorateForm from '../form/form.js';

/**
 * Embed Form block.
 *
 * Renders an adaptive form from a `guideContainer.model.json` URL that the author
 * pastes into the block's "Form JSON URL" field. This is the Universal Editor
 * equivalent of the document-authoring `form` block used on DA sites (e.g. mnp-ak),
 * where the URL is authored as a link. The URL is normalised to an <a href> and the
 * existing `form` block renderer (form.js) fetches the model and renders the form.
 */
export default async function decorate(block) {
  // The `form` block styles are not auto-loaded for this block, so load them here.
  const base = (window.hlx?.codeBasePath || '').replace(/\/$/, '');
  loadCSS(`${base}/blocks/form/form.css`);

  // The form source may be authored as a link or as a pasted URL string.
  let link = block.querySelector('a[href]');
  if (!link) {
    const text = block.textContent.trim();
    const match = text.match(/https?:\/\/\S+/);
    const url = match ? match[0] : text;
    if (!url) return;
    link = document.createElement('a');
    link.href = url;
    link.textContent = url;
    block.replaceChildren(link);
  }

  // Delegate to the form block renderer (same engine as the `form` block); it reads
  // the <a href>, fetches the model.json and replaces the link with the rendered form.
  block.classList.add('form');
  await decorateForm(block);
}
