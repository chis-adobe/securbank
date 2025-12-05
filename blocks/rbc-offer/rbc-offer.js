import { getAEMPublish, getAEMAuthor } from '../../scripts/endpointconfig.js';

/* eslint-disable no-underscore-dangle */
export default async function decorate(block) {
  const aempublishurl = getAEMPublish();
  const aemauthorurl = getAEMAuthor();
  const persistedquery = '/graphql/execute.json/securbank/OfferByPath';
  const offerpath = block.querySelector(':scope div:nth-child(1) > div a').innerHTML.trim();
  let variationname = block.querySelector(':scope div:nth-child(2) > div').textContent.trim();
  if (!variationname) {
    variationname = 'main';
  }

  const url = window.location && window.location.origin && window.location.origin.includes('author')
    ? `${aemauthorurl}${persistedquery};path=${offerpath};variation=${variationname};ts=${Math.random() * 1000}`
    : `${aempublishurl}${persistedquery};path=${offerpath};variation=${variationname};ts=${Math.random() * 1000}`;
  const options = { credentials: 'include' };

  const cfReq = await fetch(url, options)
    .then((response) => response.json())
    .then((contentfragment) => {
      let offer = '';
      if (contentfragment.data) {
        offer = contentfragment.data.offerByPath.item;
      }
      return offer;
    });

  const itemId = `urn:aemconnection:${offerpath}/jcr:content/data/master`;

  // Create mobile Scene7 URL from publish URL
  const publishUrl = cfReq.heroImage._publishUrl;
  const filename = publishUrl.split('/').pop(); // Get last part of URL (e.g., "banner-400.jpg")
  const filenameWithoutExt = filename.replace(/\.[^/.]+$/, ''); // Remove extension
  const mobileImageUrl = `https://s7d1.scene7.com/is/image/LiviuChisNA001/${filenameWithoutExt}:Small`;
  const desktopImageUrl = publishUrl;

  // Generate tag ID for Google Analytics
  const pageName = document.title || window.location.pathname.split('/').filter(Boolean).pop() || 'home';
  const blockName = 'rbc-offer';
  const ctaLabel = (cfReq.callToAction || 'View Offer Details').toLowerCase().replace(/\s+/g, '-');
  const tagId = `${pageName.toLowerCase().replace(/\s+/g, '-')}_${blockName}_${ctaLabel}`;

  block.innerHTML = `
  <div class='rbc-offer-container' data-aue-resource=${itemId} data-aue-label="offer content fragment" data-aue-type="reference" data-aue-filter="cf">
      <div class='rbc-offer-background' data-mobile-bg="${mobileImageUrl}" data-desktop-bg="${desktopImageUrl}">
        <div class='rbc-offer-overlay'></div>
        <div class='rbc-offer-content'>
          <div data-aue-prop="pretitle" data-aue-label="pretitle" data-aue-type="text" class='rbc-offer-pretitle'>${cfReq.pretitle}</div>
          <h2 data-aue-prop="headline" data-aue-label="headline" data-aue-type="text" class='rbc-offer-headline'>${cfReq.headline}</h2>
          <p data-aue-prop="detail" data-aue-label="detail" data-aue-type="richtext" class='rbc-offer-detail'>${cfReq.detail.plaintext}</p>
          <a href="#" data-aue-prop="callToAction" data-aue-label="callToAction" data-aue-type="text" class='rbc-offer-cta' data-tag-id="${tagId}">${cfReq.callToAction || 'View Offer Details'}</a>
          <div data-aue-prop="conditions" data-aue-label="conditions" data-aue-type="text" class='rbc-offer-conditions'>
            <svg class="rbc-offer-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
            </svg>
            ${cfReq.conditions || ''}
          </div>
        </div>
      </div>
  </div>
`;

  // Set background image based on viewport size
  const backgroundEl = block.querySelector('.rbc-offer-background');
  const updateBackgroundImage = () => {
    if (window.innerWidth >= 768) {
      backgroundEl.style.backgroundImage = `url(${desktopImageUrl})`;
    } else {
      backgroundEl.style.backgroundImage = `url(${mobileImageUrl})`;
    }
  };

  // Set initial background
  updateBackgroundImage();

  // Update on resize
  window.addEventListener('resize', updateBackgroundImage);
}

