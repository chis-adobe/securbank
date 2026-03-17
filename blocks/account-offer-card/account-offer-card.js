import { getAEMPublish, getAEMAuthor } from '../../scripts/endpointconfig.js';

/* eslint-disable no-underscore-dangle */
const PERSISTED_QUERY = '/graphql/execute.json/securbank/AccountOfferByPath';

/**
 * Equalize heights of inner .account-offer-card-wrapper elements by row (pairs in 2-col layout).
 * Run when block is inside .section.account-offer-card-container.
 */
function equalizeContainerRowHeights(containerSection) {
  const items = Array.from(
    containerSection.querySelectorAll('.account-offer-card.block > .account-offer-card-wrapper'),
  );
  if (items.length < 2) return;

  const run = () => {
    for (let i = 0; i < items.length; i += 2) {
      const first = items[i];
      const second = items[i + 1];
      if (!second) break;
      first.style.height = 'auto';
      second.style.height = 'auto';
      const h1 = first.offsetHeight;
      const h2 = second.offsetHeight;
      const maxH = Math.max(h1, h2);
      first.style.height = `${maxH}px`;
      second.style.height = `${maxH}px`;
    }
  };

  run();
  if (!containerSection.dataset.accountOfferCardEqualized) {
    containerSection.dataset.accountOfferCardEqualized = 'true';
    window.addEventListener('resize', run);
  }
}

export default async function decorate(block) {
  const aempublishurl = await getAEMPublish();
  const aemauthorurl = await getAEMAuthor();
  const baseUrl = window.location?.origin?.includes('author') ? aemauthorurl : aempublishurl;

  const path = block.querySelector(':scope div:nth-child(1) > div a')?.textContent?.trim()
    || block.querySelector(':scope div a')?.textContent?.trim()
    || '';
  if (!path) return;

  const url = `${baseUrl}${PERSISTED_QUERY};path=${path};ts=${Math.random() * 1000}`;
  const res = await fetch(url, { credentials: 'include' });
  const json = await res.json();
  const item = json?.data?.accountOfferByPath?.item || null;
  if (!item) return;

  const itemId = `urn:aemconnection:${path}/jcr:content/data/master`;
  const title = item.title || '';
  const offer = item.offer || '';
  const detailsHtml = item.details?.html || '';
  const ctaLabel = item.ctaLabel || 'Open an account';
  const ctaUrl = item.ctaUrl || '#';

  const banner = item.banner;
  const bannerUrl = banner?._publishUrl
    || (banner?._dynamicUrl ? `${baseUrl}${banner._dynamicUrl}` : '');
  const bannerImg = bannerUrl
    ? `<div class="account-offer-card-banner" data-aue-prop="banner" data-aue-label="Banner" data-aue-type="media"><img src="${bannerUrl}" alt="" loading="lazy"></div>`
    : '';

  block.innerHTML = `
    <div class="account-offer-card-wrapper" data-aue-resource="${itemId}" data-aue-label="account offer content fragment" data-aue-type="reference" data-aue-filter="cf">
      <h2 class="account-offer-card-title" data-aue-prop="title" data-aue-label="Title" data-aue-type="text">${title}</h2>
      ${bannerImg}
      <p class="account-offer-card-offer" data-aue-prop="offer" data-aue-label="Offer" data-aue-type="text">${offer}</p>
      ${detailsHtml ? `<div class="account-offer-card-details" data-aue-prop="details" data-aue-label="Details" data-aue-type="richtext">${detailsHtml}</div>` : ''}
      <div class="account-offer-card-actions">
        <a href="${ctaUrl}" class="account-offer-card-cta button primary" data-aue-prop="cta" data-aue-label="CTA">${ctaLabel}</a>
        <a href="${ctaUrl}" class="account-offer-card-learn-more">Learn more →</a>
      </div>
    </div>
  `;

  const containerSection = block.closest('.section.account-offer-card-container');
  if (containerSection) {
    requestAnimationFrame(() => {
      equalizeContainerRowHeights(containerSection);
    });
    setTimeout(() => equalizeContainerRowHeights(containerSection), 500);
  }
}
