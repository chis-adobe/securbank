import { getAEMPublish, getAEMAuthor } from '../../scripts/endpointconfig.js';

export default async function decorate(block) {
  const aempublishurl = await getAEMPublish();
  const aemauthorurl = await getAEMAuthor();
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
  const dollar = data.dollar || '';
  const percent = data.percent || '';
  const dollarDisplay = dollar.startsWith('$') ? dollar : `$${dollar}`;
  const sentence = `Grew ${title} by ${dollarDisplay} which represents ${percent} improvement`;

  block.innerHTML = `
  <div class="performance-statement-wrapper" data-aue-resource="${itemId}" data-aue-label="performance statement content fragment" data-aue-type="reference" data-aue-filter="cf">
    <p class="performance-statement-text" data-aue-prop="statement" data-aue-label="Statement" data-aue-type="text">${sentence}</p>
  </div>
  `;
}
