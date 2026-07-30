import { getAEMPublish, getAEMAuthor } from '../../scripts/endpointconfig.js';

/* eslint-disable no-underscore-dangle */
const PERSISTED_QUERY = '/graphql/execute.json/securbank/articleByPath';

/** Resolve a CF image reference to a URL (prefer Dynamic Media delivery). */
function resolveImage(img, pub) {
  if (!img) return '';
  if (img._dynamicUrl) return `${pub}${img._dynamicUrl}`;
  return img._publishUrl || '';
}

/**
 * Build the hero <figure>. When the CF image exposes Dynamic Media smart crops
 * (_dmS7Url + _smartCrops), emit a responsive <img> with one `s7url:CropName`
 * candidate per crop (with its width descriptor) so the browser picks the crop
 * best fitting the container and screen/DPR. Otherwise fall back to the plain
 * delivery URL.
 */
function buildHero(heroImage, pub, alt) {
  if (!heroImage) return null;
  const img = document.createElement('img');
  img.alt = alt || '';

  const s7 = heroImage._dmS7Url;
  const crops = Array.isArray(heroImage._smartCrops)
    ? heroImage._smartCrops.filter((c) => c && c.name && c.width)
    : [];

  if (s7 && crops.length) {
    const sorted = [...crops].sort((a, b) => a.width - b.width);
    img.srcset = sorted.map((c) => `${s7}:${c.name} ${c.width}w`).join(', ');
    // Article content column: ~800px on desktop, full width below the layout breakpoint.
    img.sizes = '(min-width: 900px) 800px, 100vw';
    img.src = `${s7}:${sorted[sorted.length - 1].name}`;
  } else {
    const src = resolveImage(heroImage, pub);
    if (!src) return null;
    img.src = src;
  }

  const figure = document.createElement('figure');
  figure.className = 'article-hero';
  figure.append(img);
  return figure;
}

export default async function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const articlepath = (cells[0]?.querySelector('a')?.textContent || cells[0]?.textContent || '').trim();
  const variation = (cells[1]?.textContent || '').trim() || 'main';
  if (!articlepath) {
    block.innerHTML = '';
    return;
  }

  const base = window.location?.origin?.includes('author') ? getAEMAuthor() : getAEMPublish();
  const pub = getAEMPublish();
  const url = `${base}${PERSISTED_QUERY};path=${articlepath};variation=${variation};ts=${Math.floor(Math.random() * 1000)}`;

  let item;
  try {
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();
    item = data?.data?.articleByPath?.item;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('failed to load article content fragment', e);
  }
  if (!item) {
    block.innerHTML = '';
    return;
  }

  const article = document.createElement('article');
  article.className = 'article';

  const hero = buildHero(item.heroImage, pub, item.headline);
  if (hero) article.append(hero);

  if (item.headline) {
    const h1 = document.createElement('h1');
    h1.className = 'article-headline';
    h1.textContent = item.headline;
    article.append(h1);
  }

  if (item.author) {
    const authorEl = document.createElement('div');
    authorEl.className = 'article-author';
    const picSrc = resolveImage(item.author.profilePicture, pub);
    if (picSrc) {
      const pic = document.createElement('img');
      pic.className = 'article-author-pic';
      pic.src = picSrc;
      pic.alt = item.author.name || '';
      pic.loading = 'lazy';
      authorEl.append(pic);
    }
    const meta = document.createElement('div');
    meta.className = 'article-author-meta';
    if (item.author.name) {
      const name = document.createElement('span');
      name.className = 'article-author-name';
      name.textContent = item.author.name;
      meta.append(name);
    }
    if (item.author.role) {
      const role = document.createElement('span');
      role.className = 'article-author-role';
      role.textContent = item.author.role;
      meta.append(role);
    }
    authorEl.append(meta);
    article.append(authorEl);
  }

  const bodyText = item.main?.plaintext || '';
  if (bodyText) {
    const body = document.createElement('div');
    body.className = 'article-body';
    bodyText
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((para) => {
        const p = document.createElement('p');
        p.textContent = para;
        body.append(p);
      });
    article.append(body);
  }

  block.replaceChildren(article);
}
