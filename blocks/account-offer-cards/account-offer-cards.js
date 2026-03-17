/**
 * Container block for account-offer-card blocks. Wraps children in a grid layout;
 * each child account-offer-card block makes its own GraphQL request and renders its content.
 */
export default function decorate(block) {
  const wrapper = document.createElement('div');
  wrapper.className = 'account-offer-cards-list';
  while (block.firstElementChild) {
    wrapper.appendChild(block.firstElementChild);
  }
  block.appendChild(wrapper);
}
