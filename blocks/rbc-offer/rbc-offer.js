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

  block.innerHTML = `
  <div class='rbc-offer-container' data-aue-resource=${itemId} data-aue-label="offer content fragment" data-aue-type="reference" data-aue-filter="cf">
      <div class='rbc-offer-background' style="background-image: url(${aempublishurl + cfReq.heroImage._dynamicUrl});">
        <div class='rbc-offer-overlay'></div>
        <div class='rbc-offer-content'>
          <div data-aue-prop="pretitle" data-aue-label="pretitle" data-aue-type="text" class='rbc-offer-pretitle'>${cfReq.pretitle}</div>
          <h2 data-aue-prop="headline" data-aue-label="headline" data-aue-type="text" class='rbc-offer-headline'>${cfReq.headline}</h2>
          <p data-aue-prop="detail" data-aue-label="detail" data-aue-type="richtext" class='rbc-offer-detail'>${cfReq.detail.plaintext}</p>
          <a href="#" data-aue-prop="callToAction" data-aue-label="callToAction" data-aue-type="text" class='rbc-offer-cta'>${cfReq.callToAction || 'View Offer Details'}</a>
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
}

