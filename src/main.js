const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');

function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  sidebar.classList.remove('is-open');
}

menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  sidebar.classList.toggle('is-open', open);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && sidebar.classList.contains('is-open')) {
    closeMenu();
    menuToggle.focus();
  }
});

document.querySelectorAll('.sidebar a').forEach((link) => {
  link.addEventListener('click', () => {
    closeMenu();
    if (link.hash) {
      const heading = document.querySelector(`${link.hash} h1, ${link.hash} h2`);
      heading.setAttribute('tabindex', '-1');
      window.requestAnimationFrame(() => heading.focus({ preventScroll: true }));
    }
  });
});

const copyStatus = document.querySelector('#copy-status');
document.querySelectorAll('.copy-button').forEach((button) => {
  button.addEventListener('click', async () => {
    const container = button.closest('[role="tabpanel"]') || button.closest('.code-block');
    const code = container.querySelector('pre code');
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = 'Copied';
      copyStatus.textContent = `${button.getAttribute('aria-label')} copied to clipboard.`;
    } catch {
      button.textContent = 'Select';
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent = 'Clipboard unavailable. Code selected; copy it with your keyboard or device menu.';
    }
    window.setTimeout(() => { button.textContent = 'Copy'; }, 2200);
  });
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
function activateTab(tab) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
}

activateTab(tabs[0]);
document.querySelector('.profile-tabs').hidden = false;

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    let target;
    if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') target = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === 'Home') target = tabs[0];
    if (event.key === 'End') target = tabs.at(-1);
    if (!target) return;
    event.preventDefault();
    activateTab(target);
    target.focus();
  });
});

const links = [...document.querySelectorAll('.nav-link[href^="#"]')];
const sections = links.map((link) => document.querySelector(link.hash));
let scrollScheduled = false;
function updateNavigation() {
  const threshold = window.matchMedia('(max-width: 760px)').matches ? 110 : 90;
  const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight;
  let current = sections[0];
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= threshold) current = section;
  });
  if (atBottom) current = sections.at(-1);
  links.forEach((link) => {
    const active = link.hash === `#${current.id}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scrollScheduled = false;
}

window.addEventListener('scroll', () => {
  if (scrollScheduled) return;
  scrollScheduled = true;
  window.requestAnimationFrame(updateNavigation);
}, { passive: true });
window.addEventListener('resize', () => {
  if (window.innerWidth > 760) closeMenu();
  updateNavigation();
});
updateNavigation();
