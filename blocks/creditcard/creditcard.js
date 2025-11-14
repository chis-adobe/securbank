import { getAEMPublish, getAEMAuthor } from '../../scripts/endpointconfig.js';

/* eslint-disable no-underscore-dangle */
export default async function decorate(block) {
  const aempublishurl = getAEMPublish();
  const aemauthorurl = getAEMAuthor();
  const persistedquery = '/graphql/execute.json/securbank/CreditCardByPath';
  const creditcardpath = block.querySelector(':scope div:nth-child(1) > div a').innerHTML.trim();
  let variationname = block.querySelector(':scope div:nth-child(2) > div').textContent.trim();
  if (!variationname) {
    variationname = 'main';
  }

  const url = window.location && window.location.origin && window.location.origin.includes('author')
    ? `${aemauthorurl}${persistedquery};path=${creditcardpath};variation=${variationname};ts=${Math.random() * 1000}`
    : `${aempublishurl}${persistedquery};path=${creditcardpath};variation=${variationname};ts=${Math.random() * 1000}`;
  const options = { credentials: 'include' };

  const cfReq = await fetch(url, options)
    .then((response) => response.json())
    .then((contentfragment) => {
      let creditcard = '';
      if (contentfragment.data) {
        creditcard = contentfragment.data.creditCardByPath.item;
      }
      return creditcard;
    });

  const itemId = `urn:aemconnection:${creditcardpath}/jcr:content/data/master`;

  // Build the features cards HTML
  let featuresCardsHTML = '';
  if (cfReq.features && cfReq.features.length > 0) {
    const cardsListItems = cfReq.features.map((feature, index) => {
      const featureId = `${itemId}/features/${index}`;
      const imageUrl = feature.icon?._dynamicUrl ? aempublishurl + feature.icon._dynamicUrl : '';
      const featureDescriptionHTML = feature.featureDescription?.html || `<h4>${feature.featureLabel}</h4>`;
      
      return `
        <li data-aue-resource="${featureId}" data-aue-type="component" data-aue-model="card" data-aue-label="Card">
          <div class="cards-card-image">
            <picture>
              <source type="image/webp" srcset="${imageUrl}?width=750&format=webply&optimize=medium">
              <img loading="lazy" alt="" src="${imageUrl}?width=750&format=png&optimize=medium" data-aue-prop="image" data-aue-label="Image" data-aue-type="media">
            </picture>
          </div>
          <div class="cards-card-body">
            <div data-aue-prop="text" data-aue-label="Text" data-aue-filter="text" data-aue-type="richtext">
              ${featureDescriptionHTML}
            </div>
          </div>
        </li>
      `;
    }).join('');

    featuresCardsHTML = `
      <div data-aue-type="container" data-aue-resource="${itemId}" data-aue-behavior="component" data-aue-model="section" data-aue-label="Section" data-aue-filter="section" class="section credit-card-detail cards-container" data-section-status="loaded">
        <div class="default-content-wrapper">
          <h2 data-aue-behavior="component" data-aue-model="title" data-aue-label="Title" id="features" data-aue-resource="${itemId}/features" data-aue-prop="title" data-aue-type="text">Features</h2>
        </div>
        <div class="cards-wrapper">
          <div data-aue-resource="${itemId}/features/cards" data-aue-type="container" data-aue-behavior="component" data-aue-label="Cards" data-aue-filter="cards" class="cards block" data-block-name="cards" data-block-status="loaded">
            <ul>
              ${cardsListItems}
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  // Main credit card image URL
  const creditCardImageUrl = cfReq.creditCardImage?._dynamicUrl 
    ? aempublishurl + cfReq.creditCardImage._dynamicUrl 
    : '';

  block.innerHTML = `
    <div data-aue-type="container" data-aue-resource="${itemId}" data-aue-behavior="component" data-aue-model="section" data-aue-label="Section" data-aue-filter="section" class="section credit-card-detail columns-container" data-section-status="loaded">
      <div class="columns-wrapper">
        <div class="columns block columns-2-cols" data-aue-resource="${itemId}/columns" data-aue-type="container" data-aue-model="columns" data-aue-label="Columns" data-aue-filter="columns" data-aue-behavior="component" data-block-name="columns" data-block-status="loaded">
          <div>
            <div data-aue-resource="${itemId}/col1" data-aue-type="container" data-aue-label="Column" data-aue-filter="column">
              <h1 data-aue-behavior="component" data-aue-model="title" data-aue-label="Title" id="${cfReq.creditCardName?.toLowerCase().replace(/\s+/g, '-') || 'credit-card'}" data-aue-resource="${itemId}/title" data-aue-prop="creditCardName" data-aue-type="text">${cfReq.creditCardName || ''}</h1>
              <div data-aue-resource="${itemId}/text" data-aue-behavior="component" data-aue-prop="shortSummary" data-aue-label="Text" data-aue-filter="text" data-aue-type="richtext">
                <p>${cfReq.shortSummary?.plaintext || ''}</p>
              </div>
            </div>
            <div data-aue-resource="${itemId}/col2" data-aue-type="container" data-aue-label="Column" data-aue-filter="column" class="columns-img-col">
              <p data-aue-resource="${itemId}/image" data-aue-type="component" data-aue-model="image" data-aue-label="Image" data-aue-behavior="component">
                <picture>
                  <img src="${creditCardImageUrl}?width=1280&preferwebp=true&quality=85" alt="${cfReq.creditCardName || 'Credit Card'}">
                </picture>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    ${featuresCardsHTML}
  `;
}

