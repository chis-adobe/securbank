import { getAEMPublish, getAEMAuthor } from '../../scripts/endpointconfig.js';

/* eslint-disable no-underscore-dangle */
function collectDisclaimerHtml(disclaimer) {
  const parts = [];
  (disclaimer.referencedDisclaimers || []).forEach((ref) => {
    (ref.termDetails || []).forEach((td) => {
      if (td.html) parts.push(td.html);
    });
  });
  (disclaimer.termDetails || []).forEach((td) => {
    if (td.html) parts.push(td.html);
  });
  return parts;
}

export default async function decorate(block) {
  const aempublishurl = getAEMPublish();
  const aemauthorurl = getAEMAuthor();
  const persistedquery = '/graphql/execute.json/securbank/RBCOfferByPath';
  const offerpath = block.querySelector(':scope div:nth-child(1) > div a')?.innerHTML?.trim() || '';
  if (!offerpath) return;

  const url = window.location?.origin?.includes('author')
    ? `${aemauthorurl}${persistedquery};path=${offerpath};ts=${Math.random() * 1000}`
    : `${aempublishurl}${persistedquery};path=${offerpath};ts=${Math.random() * 1000}`;
  const options = { credentials: 'include' };

  const cfReq = await fetch(url, options)
    .then((res) => res.json())
    .then((data) => data?.data?.rbcOfferByPath?.item || null);

  if (!cfReq) return;

  const itemId = `urn:aemconnection:${offerpath}/jcr:content/data/master`;

  const descriptionHtml = cfReq.description?.html || '';
  const ctaText = cfReq.ctaText || 'Open an Account';
  const ctaUrl = cfReq.ctaUrl || '#';
  const imageUrl = cfReq.image?._publishUrl || cfReq.illustration?._publishUrl || cfReq.image?._dynamicUrl
    ? (cfReq.image?._publishUrl || cfReq.illustration?._publishUrl || `${aempublishurl}${cfReq.image?._dynamicUrl || cfReq.illustration?._dynamicUrl}`)
    : '';

  const pageName = (document.title || window.location.pathname.split('/').filter(Boolean).pop() || 'home')
    .toLowerCase().replace(/\s+/g, '-');
  const blockName = 'rbc-offer-card';
  const ctaLabel = ctaText.toLowerCase().replace(/\s+/g, '-');
  const tagId = `${pageName}_${blockName}_${ctaLabel}`;

  const disclaimerParts = (cfReq.disclaimer || []).flatMap((d) => collectDisclaimerHtml(d));
  const disclaimerBlocks = disclaimerParts
    .map((html) => `<div class="rbc-offer-card-disclaimer-block">${html}</div>`)
    .join('<hr class="rbc-offer-card-disclaimer-sep">');

  block.innerHTML = `
  <div class="rbc-offer-card-wrapper" data-aue-resource="${itemId}" data-aue-label="rbc offer content fragment" data-aue-type="reference" data-aue-filter="cf">
    <div class="rbc-offer-card-main">
      <div class="rbc-offer-card-logo">
        <img src="/icons/rbc-logo-shield.svg" alt="RBC" width="35" height="46">
      </div>
      <div class="rbc-offer-card-content">
        <div class="rbc-offer-card-description" data-aue-prop="description" data-aue-label="description" data-aue-type="richtext">
          ${descriptionHtml}
        </div>
        <a href="${ctaUrl}" class="rbc-offer-card-cta" data-tag-id="${tagId}" data-aue-prop="cta" data-aue-label="CTA">${ctaText}</a>
      </div>
      ${imageUrl ? `<div class="rbc-offer-card-image"><img src="${imageUrl}" alt="" loading="lazy"></div>` : ''}
    </div>
    ${disclaimerBlocks ? `<div class="rbc-offer-card-disclaimers">${disclaimerBlocks}</div>` : ''}
  </div>
  `;
}
