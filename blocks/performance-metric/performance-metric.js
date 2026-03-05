import { getAEMPublish, getAEMAuthor } from '../../scripts/endpointconfig.js';

/* eslint-disable no-underscore-dangle */
const SCENE7_BASE = 'https://s7d1.scene7.com/is/image/LiviuChisNA001';
const ASSET_PREFIX = 'LiviuChisNA001';

function getImageName(image) {
  if (!image) return '';
  if (image._dmS7Url) {
    const path = image._dmS7Url.split('?')[0];
    return path.split('/').pop() || '';
  }
  if (image._publishUrl) {
    const filename = image._publishUrl.split('/').pop() || '';
    return filename.replace(/\.[^/.]+$/, '');
  }
  return '';
}

export default async function decorate(block) {
  const aempublishurl = getAEMPublish();
  const aemauthorurl = getAEMAuthor();
  const persistedquery = '/graphql/execute.json/securbank/MetricByPath';
  const fragmentPath = block.querySelector(':scope div:nth-child(1) > div a')?.innerHTML?.trim() || '';
  if (!fragmentPath) return;

  const url = window.location?.origin?.includes('author')
    ? `${aemauthorurl}${persistedquery};path=${fragmentPath};ts=${Math.random() * 1000}`
    : `${aempublishurl}${persistedquery};path=${fragmentPath};ts=${Math.random() * 1000}`;
  const options = { credentials: 'include' };

  const data = await fetch(url, options)
    .then((res) => res.json())
    .then((json) => json?.data?.performanceMetricByPath?.item || null);

  if (!data) return;

  const itemId = `urn:aemconnection:${fragmentPath}/jcr:content/data/master`;
  const title = data.title || '';
  const descriptionHtml = data.description?.html || '';
  const dollar = data.dollar || '';
  const percent = data.percent || '';
  const imageName = getImageName(data.image);

  const params = new URLSearchParams({
    $image: `${ASSET_PREFIX}/${imageName}`,
    $dollar: dollar,
    $percent: percent,
    wid: '2000',
    hei: '2000',
    qlt: '100',
    fit: 'constrain',
  });
  const imageUrl = `${SCENE7_BASE}/PerformanceMetric?${params.toString()}`;

  block.innerHTML = `
  <div class="performance-metric-wrapper" data-aue-resource="${itemId}" data-aue-label="performance metric content fragment" data-aue-type="reference" data-aue-filter="cf">
    <div class="performance-metric-image">
      <img src="${imageUrl}" alt="${title}" loading="lazy">
    </div>
    <div class="performance-metric-content">
      <h3 class="performance-metric-title" data-aue-prop="title" data-aue-label="Title" data-aue-type="text">${title}</h3>
      <div class="performance-metric-description" data-aue-prop="description" data-aue-label="Description" data-aue-type="richtext">${descriptionHtml}</div>
    </div>
  </div>
  `;
}
