import { decorateBlock, loadBlock } from '../../scripts/aem.js';

export default async function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // Load any blocks authored inside a column (e.g. form, embed-adaptive-form,
  // embed-form). The default EDS loader only decorates top-level blocks
  // (div.section > div > div), so blocks nested inside a column are never
  // decorated. Do it here — decorateBlock/loadBlock are idempotent and
  // loadBlock swallows load errors, so non-block content is left untouched.
  const nestedBlocks = [...block.querySelectorAll(':scope > div > div > div[class]')]
    .filter((el) => !el.dataset.blockStatus);
  await Promise.all(nestedBlocks.map((el) => {
    decorateBlock(el);
    return loadBlock(el);
  }));

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
