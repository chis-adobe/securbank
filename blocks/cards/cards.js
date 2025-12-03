import { createOptimizedPicture, decorateButtons } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    
    // Extract tagId before moving children (3rd cell if exists)
    let tagId = null;
    const cells = [...row.children];
    if (cells.length >= 3) {
      const tagIdCell = cells[2];
      tagId = tagIdCell.textContent.trim();
    }
    
    while (row.firstElementChild) li.append(row.firstElementChild);
    
    [...li.children].forEach((div, index) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-card-image';
      } else if (index === 2 && tagId) {
        // This is the tagId cell, hide it
        div.style.display = 'none';
      } else {
        div.className = 'cards-card-body';
      }
    });
    
    // Apply tagId to anchor tags within this card
    if (tagId) {
      li.querySelectorAll('a').forEach((a) => {
        a.setAttribute('data-tag-id', tagId);
      });
    }
    
    ul.append(li);
  });
  ul.querySelectorAll('img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  ul.querySelectorAll('a').forEach((a) => {
    a.className = 'button secondary';
    decorateButtons(a);
  });
  block.textContent = '';
  block.append(ul);
}
