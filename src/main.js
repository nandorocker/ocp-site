import './repository.js';

const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
document.documentElement.classList.add('js');
if (menuToggle) menuToggle.hidden = false;

function closeMenu() {
  menuToggle?.setAttribute('aria-expanded', 'false');
  sidebar?.classList.remove('is-open');
}
menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  sidebar.classList.toggle('is-open', open);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && sidebar?.classList.contains('is-open')) {
    closeMenu();
    menuToggle.focus();
  }
});
sidebar?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) closeMenu();
});

const copyStatus = document.querySelector('#copy-status');
const copyToast = document.querySelector('#copy-toast');
let statusTimeout;
function showCopyStatus(message) {
  window.clearTimeout(statusTimeout);
  copyStatus.textContent = message;
  copyToast.textContent = message;
  copyToast.hidden = false;
  statusTimeout = window.setTimeout(() => { copyToast.hidden = true; copyStatus.textContent = ''; }, 5000);
}
document.querySelectorAll('.copy-button').forEach((button) => {
  const container = button.closest('.code-block');
  const code = container.querySelector('pre code');
  button.setAttribute('aria-label', `Copy ${container.querySelector('.code-heading span').textContent} example`);
  button.hidden = false;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = 'Copied';
      showCopyStatus('Thank you for your configuration.');
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = 'Select';
      showCopyStatus('Clipboard unavailable. Code selected; copy it with your keyboard or device menu.');
    }
    window.setTimeout(() => { button.textContent = 'Copy'; }, 2200);
  });
});

// Keep old shared homepage section links useful after the move to separate pages.
function followLegacyLink() {
  if (document.body.dataset.page !== 'home') return;
  const link = [...document.querySelectorAll('.legacy-links a')].find((item) => `#${item.id}` === window.location.hash);
  if (link) window.location.replace(link.href);
}
window.addEventListener('hashchange', followLegacyLink);
followLegacyLink();
