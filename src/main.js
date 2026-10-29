// Keep old installation bookmarks useful, including OS-specific anchors.
const installRedirect = document.querySelector('[data-install-redirect]');
if (installRedirect) {
  const target = new URL(installRedirect.href);
  if (['#macos', '#linux'].includes(window.location.hash)) target.hash = window.location.hash;
  window.location.replace(target.href);
}

document.querySelectorAll('.install-tabs').forEach((container) => {
  const tablist = container.querySelector('.install-tablist');
  const tabs = [...tablist.querySelectorAll('button')];
  const panels = tabs.map((tab) => document.getElementById(tab.dataset.panel));

  function activate(index) {
    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[position].hidden = !selected;
    });
  }
  function activateFromHash() {
    const index = panels.findIndex((panel) => `#${panel.id}` === window.location.hash);
    if (index >= 0) activate(index);
  }
  tablist.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(next);
      tabs[next].focus();
    });
  });
  activate(0);
  activateFromHash();
  tablist.hidden = false;
  window.addEventListener('hashchange', activateFromHash);
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
  const label = `Copy ${container.querySelector('.code-heading span').textContent} example`;
  button.setAttribute('aria-label', label);
  button.title = 'Copy';
  button.hidden = false;
  let buttonTimeout;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.dataset.copyState = 'copied';
      button.title = 'Copied';
      showCopyStatus('Thank you for your configuration.');
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      button.dataset.copyState = 'selected';
      button.title = 'Code selected';
      showCopyStatus('Clipboard unavailable. Code selected; copy it with your keyboard or device menu.');
    }
    window.clearTimeout(buttonTimeout);
    buttonTimeout = window.setTimeout(() => { delete button.dataset.copyState; button.title = 'Copy'; }, 2200);
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
