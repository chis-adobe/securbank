/* eslint-disable no-unused-expressions */
import authenticate from '../../scripts/auth.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { decorateNavAuth } from '../header/header.js';

function decorateAuthenticatedState(parent, user) {
  const USER_INFO = `<div class="dashboard-mini">
      <span class="dashboard-mini-welcome">Welcome back ${user.firstName}!</span>
      <div class="dashboard-mini-account-balance">
        <span class="dashboard-mini-account-balance-heading">Account Balance</span>
        <p class="dashboard-mini-account-balance-value">$1,920.00</p>
      </div>
      <div class=dashboard-mini-quick-actions>
        <span><a href="https://securbank-react.vercel.app/" target="_blank">View account information</a></span>
      </div>
    </div>
  `;
  const miniDashboard = document.createElement('div');
  miniDashboard.classList.add('user-info');
  miniDashboard.innerHTML = USER_INFO;
  parent.append(miniDashboard);
}

function decorateUnAuthenticatedState(parent) {
  const FORM = `<form class="login-form">
      <div id="login-message" class="login-form-message">
        <span>Welcome back!</span>
        <p class="error-message" style="display:block"></p>
      </div>
      <div class="login-form-input">
        <div class="login-form-label">
          <span>Username</span>
        </div>
        <div id="login-username">
          <input id="username" type="text" placeholder="e.g. jdoe@adobe.com" />
        </div>
      </div>
      <div class="login-form-input">
        <div class="login-form-label">
          <span>Password</span>
        </div>
        <div id="login-password">
          <input id="password" type="password" placeholder="At least 8 characters" />
        </div>
      </div>
      <div class="login-form-submit">
        <div id="login-submit">
          <input id="login-button" type="submit" value="Log In" />
        </div>
      </div>
      <div class="login-form-forgot-password">
        <span>Forgot user ID or password?</span>
      </div>
    </form>`;

  const loginForm = document.createElement('div');
  loginForm.classList.add('login');
  loginForm.id = 'log-in';
  loginForm.innerHTML = FORM;
  const form = loginForm.firstElementChild;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    authenticate(username, password).then((user) => {
      // console.log(user);
      if (user === null) {
        const errorMessage = document.getElementsByClassName('error-message')[0];
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Authentication failed.';
      } else {
        const errorMessage = document.getElementsByClassName('error-message')[0];
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
        document.getElementById('log-in').remove();
        decorateAuthenticatedState(parent, user);
        decorateNavAuth();
      }
    });
    // handle submit
  });
  parent.append(loginForm);
}

/**
 * Sets up the two hero cards as mobile accordion panels (all visuals in CSS).
 * The text card is open by default and reuses its h1 as the panel title; the
 * login card is collapsed by default under an injected "Login" header.
 * @param {Element} heroBody the .hero-body container
 */
function setupHeroAccordion(heroBody) {
  const textCard = heroBody.querySelector(':scope > div:not(.login)');
  if (textCard) {
    textCard.classList.add('hero-text', 'open');
    const h1 = textCard.querySelector('h1');
    if (h1) {
      // h1 doubles as the collapsed title; mirror it to title="" for the tooltip
      // shown when the single-line title is truncated
      textCard.setAttribute('title', h1.textContent);
      h1.addEventListener('click', () => textCard.classList.toggle('open'));
    }
  }

  const loginCard = heroBody.querySelector(':scope > .login');
  if (loginCard) {
    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'hero-accordion-header';
    header.textContent = 'Login';
    header.addEventListener('click', () => loginCard.classList.toggle('open'));
    loginCard.prepend(header);
  }
}

// Dynamic Media smart-crop sources, largest viewport first. "Portait" is spelled
// to match the crop name defined on the DM asset (not a typo on our side).
const HERO_SMART_CROPS = [
  { name: 'Large', width: 2520, media: '(min-width: 900px)' },
  { name: 'Medium', width: 1400, media: '(min-width: 600px)' },
  { name: 'Portait', width: 1100, media: '(min-width: 400px)' },
  { name: 'Small', width: 800 },
];

/**
 * Builds a responsive <picture> from a Dynamic Media delivery URL — one <source>
 * per smart crop so the browser serves the crop best suited to the width.
 * @param {string} src the DM delivery URL (no query string)
 * @param {string} alt alt text
 * @returns {HTMLPictureElement}
 */
function buildSmartCropPicture(src, alt) {
  const picture = document.createElement('picture');
  HERO_SMART_CROPS.forEach(({ name, width, media }) => {
    const source = document.createElement('source');
    source.srcset = `${src}?smartcrop=${name}&width=${width}`;
    if (media) source.media = media;
    picture.append(source);
  });
  const fallback = HERO_SMART_CROPS[HERO_SMART_CROPS.length - 1];
  const img = document.createElement('img');
  img.src = `${src}?smartcrop=${fallback.name}&width=${fallback.width}`;
  img.alt = alt || '';
  img.loading = 'lazy';
  picture.append(img);
  return picture;
}

export default async function decorate(block) {
  let row = block.firstElementChild;
  let bg = row.querySelector('picture');
  if (!bg) {
    // Dynamic Media: the row holds an <a> to the delivery URL instead of a
    // <picture>. Convert it to a smart-crop responsive picture. Anything else
    // (no DM anchor) falls through and renders as before.
    const dmLink = row.querySelector('a[href*="/adobe/assets/"]');
    if (dmLink) bg = buildSmartCropPicture(dmLink.getAttribute('href'), dmLink.textContent.trim());
  }
  if (bg) block.append(bg);
  row.remove();
  const bgP = block.closest('p');
  if (bgP) bgP.remove();
  row = block.firstElementChild;
  row.classList.add('hero-body');
  const content = document.getElementsByClassName('hero-body')[0].children[0].children[0].children[0];
  moveInstrumentation(row, content);
  if (block.classList.contains('authbox')) {
    window.localStorage.getItem('auth') === null ? decorateUnAuthenticatedState(row) : decorateAuthenticatedState(row, JSON.parse(window.localStorage.getItem('auth')));
  }

  setupHeroAccordion(row);
}
