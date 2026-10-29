import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/docs/', '/quick-start/'];

for (const route of routes) {
  test(`loads ${route} directly, including in the production subpath`, async ({ page }) => {
    const failures = [];
    page.on('pageerror', (error) => failures.push(error.message));
    for (const base of ['http://127.0.0.1:5175', 'http://127.0.0.1:4175/ocp-site']) {
      const response = await page.goto(`${base}${route}`);
      expect(response.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('body')).not.toContainText('↗');
      await expect(page.locator('body')).not.toContainText(/ocp ui|browser editor/i);
      await expect(page.locator('#browser')).toHaveCount(0);
      expect(await page.locator('.desktop-brand img').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      const logoPath = `${base.includes('4175') ? '/ocp-site' : ''}/logo.svg`;
      for (const logo of await page.locator('.brand img').all()) {
        await expect(logo).toHaveAttribute('src', logoPath);
        expect(await logo.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      }
      await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', logoPath);
      await expect(page.locator('link[rel="icon"]')).toHaveAttribute('type', 'image/svg+xml');
      expect(await page.locator('style[data-site-styles]').evaluate((style) => Boolean(style.sheet?.cssRules.length))).toBe(true);
      const ids = await page.locator('[id]').evaluateAll((elements) => elements.map((element) => element.id));
      expect(new Set(ids).size).toBe(ids.length);
       if (route !== '/') {
         const active = page.locator('.landing-nav [aria-current="page"]');
        await expect(active).toHaveCount(1);
        await expect(active).toHaveAttribute('href', `${base.includes('4175') ? '/ocp-site' : ''}${route}`);
         await expect(active).toHaveCSS('text-decoration-line', 'underline');
       }
       await expect(page.locator('.sidebar')).toHaveCount(0);
       await expect(page.locator('.page-toc, .mobile-toc')).toHaveCount(route === '/docs/' ? 2 : 0);
    }
    expect(failures).toEqual([]);
  });
}

for (const width of [390, 1440]) {
  test(`documentation keeps its section navigation without JavaScript at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
    try {
      const page = await context.newPage();
      for (const base of ['http://127.0.0.1:5175', 'http://127.0.0.1:4175/ocp-site']) {
        await page.goto(`${base}/docs/`);
        const toc = page.locator(width < 1280 ? '.mobile-toc' : '.page-toc');
        await expect(toc).toBeVisible();
        if (width >= 1280) {
          await expect(toc).toHaveCSS('position', 'sticky');
          await expect(toc).toHaveCSS('top', '100px');
        }
        const headings = await page.locator('.prose h2[id]').evaluateAll((items) => items.map((item) => item.id));
        await expect(toc.locator('p, summary')).toHaveCount(0);
        expect(await toc.locator('a').evaluateAll((items) => items.map((item) => item.hash.slice(1)))).toEqual(headings);
        await toc.getByRole('link', { name: 'Multi-machine setup', exact: true }).click();
        await expect(page).toHaveURL(`${base}/docs/#machines`);
        const heading = await page.locator('#machines').boundingBox();
        const navbar = await page.locator('.landing-nav').boundingBox();
        expect(heading.y).toBeGreaterThanOrEqual(navbar.y + navbar.height);
      }
    } finally {
      await context.close();
    }
  });
}

test('landing page follows the copy deck and promotes installation', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('OCP: Take your coding agent setup anywhere you work');
  await expect(page.locator('h1')).toHaveText('Take your coding agent setup anywhere you work.');
  await expect(page.locator('.hero-support')).toHaveText('Currently supports OpenCode. More harnesses coming soon!');
  await expect(page.locator('.hero-support')).toHaveCSS('text-decoration-color', 'rgb(254, 178, 26)');
  await expect(page.locator('.trust-line, .hero-visual figcaption')).toHaveCount(0);
  await expect(page.locator('#copy-status')).toBeEmpty();
  await expect(page.locator('#copy-toast')).toBeHidden();
  await expect(page.locator('body')).not.toContainText('Thank you for your configuration.');
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(252, 252, 250)');
  await expect(page.locator('.landing-nav')).toHaveCSS('position', 'sticky');
  await expect(page.locator('.hero').getByRole('link', { name: 'Install', exact: true })).toHaveAttribute('href', '#getting-started');
  await expect(page.locator('.hero').getByRole('link', { name: 'Read the docs' })).toHaveAttribute('href', '/docs/');
  await expect(page.locator('.button-primary [aria-hidden="true"]')).toHaveText(['→', '→']);
  await expect(page.locator('.button-secondary')).toHaveText(['Read the docs', 'Read the docs']);
  await expect(page.locator('main pre')).toHaveCount(6);
  await expect(page.locator('main .copy-button')).toHaveCount(6);
  await expect(page.locator('.comparison-panel')).toHaveCount(2);
  await expect(page.locator('.before .config-machine')).toHaveCount(2);
  await expect(page.locator('.before .drift-label')).toHaveText(['Different', 'Different', 'Missing', 'Missing']);
  await expect(page.locator('.before .config-machine').first()).toContainText('debugging/SKILL.md');
  await expect(page.locator('.before .config-machine').last()).toContainText('debugging/SKILL.md');
  for (const label of await page.locator('.difference-label').all()) {
    await expect(label).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(label).toHaveCSS('border-color', 'rgb(254, 178, 26)');
  }
  await expect(page.locator('.before .missing-file .file-name')).toHaveText(['writing/SKILL.md', 'bridge.ts']);
  for (const file of await page.locator('.before .missing-file .file-name').all()) {
    await expect(file).toHaveCSS('text-decoration-line', 'line-through');
    await expect(file).toHaveCSS('opacity', '0.5');
  }
  await expect(page.locator('.before .drift-status')).toHaveText(['✕ Drifts', '✕ Drifts']);
  await expect(page.locator('.before .drift-status').first()).toHaveCSS('font-size', await page.locator('.after .match-label').first().evaluate((element) => getComputedStyle(element).fontSize));
  await expect(page.locator('.manual-transfer, .comparison-caption')).toHaveCount(0);
  const beforeWindows = await page.locator('.before .config-machine').all();
  const desktopWindow = await beforeWindows[0].boundingBox();
  const laptopWindow = await beforeWindows[1].boundingBox();
  expect(laptopWindow.x).toBeLessThan(desktopWindow.x + desktopWindow.width);
  expect(laptopWindow.y).toBeLessThan(desktopWindow.y + desktopWindow.height);
  await expect(page.locator('.after .ocp-source')).toContainText('Agents');
  await expect(page.locator('.after .config-machine')).toHaveCount(2);
  await expect(page.locator('.after .match-label')).toHaveText(['✓ In sync', '✓ In sync']);
  const generatedFiles = await page.locator('.after .config-files').allTextContents();
  expect(generatedFiles[0]).toBe(generatedFiles[1]);
  const fileNames = await page.locator('.comparison .config-machine').evaluateAll((machines) => machines.map((machine) => [...machine.querySelectorAll('.config-files li')].filter((item) => !item.querySelector('ul')).map((item) => {
    const copy = item.cloneNode(true);
    copy.querySelectorAll('.drift-label').forEach((label) => label.remove());
    return copy.textContent.trim();
  })));
  expect(fileNames).toEqual(Array(4).fill(['reviewer.md', 'writing/SKILL.md', 'debugging/SKILL.md', 'bridge.ts', 'opencode.json']));
  await expect(page.locator('.directives article')).toHaveCount(3);
  await expect(page.locator('.profile-comparison')).toContainText('Implementer');
  await expect(page.locator('.profile-comparison')).toContainText('Reviewer');
  await expect(page.locator('.machine-diagram, .profile-diagram, .machines-section')).toHaveCount(0);
  await expect(page.locator('#machines')).toHaveClass('machine-note');
  await expect(page.locator('.backup-warning')).toContainText('Back up first.');
  await expect(page.locator('#getting-started')).toContainText('~/.local/bin/ocp setup');
  await expect(page.locator('#getting-started')).toContainText('opencode');
  const heroInstall = await page.locator('.hero .code-block').boundingBox();
  expect(heroInstall.y + heroInstall.height).toBeLessThan(900);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://ocp.nan.do/ocp-social.png');
});

for (const width of [390, 1440]) {
  test(`first render stays styled without external CSS or JavaScript at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
    await context.route('**/*', (route) => ['stylesheet', 'font'].includes(route.request().resourceType()) ? route.abort() : route.continue());
    const page = await context.newPage();
    try {
      for (const base of ['http://127.0.0.1:5175', 'http://127.0.0.1:4175/ocp-site']) {
        await page.goto(`${base}/`);
        await expect(page.locator('body')).toHaveCSS('font-size', width >= 1024 ? '20px' : '18px');
        await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(252, 252, 250)');
        await expect(page.locator('h1')).toBeVisible();
        const illustration = page.locator('.hero-illustration');
        await expect(illustration).toBeVisible();
         await expect(illustration).toHaveAttribute('src', `${base.includes('4175') ? '/ocp-site' : ''}/ocp-network.png`);
         expect(await illustration.evaluate((img) => img.complete && img.naturalWidth === 1448)).toBe(true);
        const imageBounds = await illustration.boundingBox();
        expect(imageBounds.width).toBeGreaterThan(width > 900 ? 300 : 120);
        const copyBounds = await page.locator('.hero-copy').boundingBox();
         if (width > 900) {
           expect(imageBounds.x).toBeGreaterThanOrEqual(copyBounds.x + copyBounds.width);
        } else {
          expect(imageBounds.y).toBeGreaterThanOrEqual(copyBounds.y + copyBounds.height);
        }
         expect(imageBounds.width / imageBounds.height).toBeCloseTo(1448 / 1086, 2);
         await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
         await expect(page.locator('.copy-button').first()).toBeHidden();
         await expect(page.locator('#copy-status')).toBeEmpty();
         await expect(page.locator('#copy-toast')).toBeHidden();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
    } finally {
      await context.close();
    }
  });
}

test('all internal pages, anchors, and assets resolve under the production prefix', async ({ page, request }) => {
  const origin = 'http://127.0.0.1:4175';
  const documents = new Map();
  async function document(url) {
    if (!documents.has(url)) {
      const response = await request.get(url);
      expect(response.status(), url).toBe(200);
      documents.set(url, await response.text());
    }
    return documents.get(url);
  }
  for (const route of routes) {
    await page.goto(`${origin}/ocp-site${route}`);
    const links = await page.locator('a[href]').evaluateAll((elements) => elements.map((element) => element.href));
    for (const value of links) {
      const url = new URL(value);
      if (url.origin !== origin) continue;
      expect(url.pathname, value).toMatch(/^\/ocp-site\//);
      const html = await document(`${url.origin}${url.pathname}`);
      if (url.hash) expect(html, value).toContain(`id="${decodeURIComponent(url.hash.slice(1))}"`);
    }
    const assets = await page.locator('img[src], script[src], link[rel="stylesheet"], link[rel="icon"]').evaluateAll((elements) => elements.map((element) => element.src || element.href));
    for (const asset of assets) {
      if (new URL(asset).origin !== origin) continue;
      expect((await request.get(asset)).status(), asset).toBe(200);
    }
  }
});

test('unknown pages do not silently render the homepage', async ({ request }) => {
  for (const base of ['http://127.0.0.1:5175', 'http://127.0.0.1:4175/ocp-site']) {
    for (const route of ['not-a-page', 'profiles', 'components', 'machines', 'existing-setup', 'browser', 'agents', 'commands', 'configuration', 'troubleshooting']) {
      expect((await request.get(`${base}/${route}/`)).status()).toBe(404);
    }
  }
});

test('installation has visible OS sections and quick start explains the workflow', async ({ page }) => {
  await page.goto('/quick-start/');
  await expect(page.locator('.document-header .back-to-docs')).toHaveText('Quick start');
  await expect(page.locator('h1')).toHaveText('Getting started with OCP');
  await expect(page.locator('.document-header')).not.toContainText('Documentation');
  await expect(page.getByRole('heading', { name: 'What am I creating?' })).toHaveCount(0);
  await expect(page.locator('.prose > p').first()).toHaveText('Setup is easy: import your existing config or start fresh. Switching profiles is a breeze, and you can sync across machines with one command.');
  await expect(page.locator('.prose > p').first().locator('code')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'macOS', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Linux', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Linux', exact: true })).toBeVisible();
  await expect(page.locator('.prose')).toContainText("Native Windows isn't supported yet.");
  await expect(page.locator('.prose h2').first()).toHaveText('Install OCP');
  for (const concept of ['source', 'profile', 'renders', 'Indentation', 'placeholder', 'preserves', 'apply', 'use focused']) {
    await expect(page.locator('.prose')).toContainText(concept);
  }
});

test('documentation explains T3 fit and agent approval boundaries', async ({ page }) => {
  await page.goto('/docs/#agents');
  await expect(page.locator('.prose')).toContainText('T3');
  await expect(page.locator('.prose')).toContainText("OCP doesn't configure T3");
  await expect(page.locator('.prose')).toContainText('Ask before running apply');
  await expect(page.locator('.prose')).toContainText('not pushes');
});

test('author credits and coffee buttons keep their exact styling and destinations', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="author"]')).toHaveAttribute('content', 'Nando Rossi');
  await expect(page.locator('.footer-credit').getByRole('link', { name: 'Nando Rossi' })).toHaveAttribute('href', 'https://nan.do');
  await expect(page.locator('.footer-credit')).toContainText('Made by Nando Rossi • License AGPL-3.0');
  await expect(page.locator('.footer-credit')).toContainText('© 2026');
  await expect(page.locator('.footer-credit br')).toHaveCount(0);
  await expect(page.locator('.page-footer')).toHaveCSS('background-color', 'rgb(37, 40, 45)');
  await expect(page.locator('.footer-credit')).toHaveCSS('color', 'rgb(237, 240, 243)');
  await expect(page.locator('.footer-credit').getByRole('link', { name: 'AGPL-3.0', exact: true })).toHaveAttribute('href', 'https://github.com/nandorocker/ocp/blob/main/LICENSE');
  await expect(page.locator('.footer-support')).toContainText('Find this useful? Support me!');
  await expect(page.locator('.closing')).toContainText('Nando Rossi, the developer behind OCP.');
  const coffees = page.getByRole('link', { name: 'Buy me a coffee', exact: true });
   await expect(coffees).toHaveCount(1);
   await expect(page.locator('.page-footer .coffee-link')).toHaveText('Buy me a coffee');
  for (const coffee of await coffees.all()) {
    await expect(coffee).toHaveAttribute('href', 'https://buymeacoffee.com/nandorossi');
    await expect(coffee).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(coffee).toHaveCSS('background-color', 'rgb(254, 178, 26)');
    await expect(coffee).toHaveCSS('color', 'rgb(26, 18, 8)');
    await expect(coffee).toHaveCSS('border-radius', '8px');
    await expect(coffee).toHaveCSS('min-height', '48px');
  }
  await coffees.last().hover();
  await expect(coffees.last()).toHaveCSS('animation-name', 'none');
});

test('OS tabs support keyboard navigation and deep links', async ({ page }) => {
  await page.goto('/quick-start/#linux');
  const mac = page.getByRole('tab', { name: 'macOS', exact: true });
  const linux = page.getByRole('tab', { name: 'Linux', exact: true });
  await expect(linux).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#linux')).toBeVisible();
  await expect(page.locator('#macos')).toBeHidden();
  await linux.focus();
  await page.keyboard.press('ArrowRight');
  await expect(mac).toBeFocused();
  await expect(mac).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(linux).toBeFocused();
  await page.keyboard.press('Home');
  await expect(mac).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(linux).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#linux')).toBeFocused();
  await page.evaluate(() => { window.location.hash = 'macos'; });
  await expect(mac).toHaveAttribute('aria-selected', 'true');
});

for (const javaScriptEnabled of [true, false]) {
  test(`old install links redirect with JavaScript ${javaScriptEnabled}`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled });
    try {
      const page = await context.newPage();
      for (const base of ['http://127.0.0.1:5175', 'http://127.0.0.1:4175/ocp-site']) {
        await page.goto(`${base}/install/`);
        await expect(page).toHaveURL(`${base}/quick-start/#install`);
        await expect(page.locator('#install')).toBeVisible();
      }
    } finally {
      await context.close();
    }
  });
}

test('old OS bookmarks open the matching tab', async ({ page }) => {
  await page.goto('/install/#linux');
  await expect(page).toHaveURL(/\/quick-start\/#linux$/);
  await expect(page.getByRole('tab', { name: 'Linux', exact: true })).toHaveAttribute('aria-selected', 'true');
});

test('copies the chosen example and reports a clipboard fallback', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Copy Set up OCP example', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('~/.local/bin/ocp setup');
  await expect(page.getByRole('status')).toHaveText('Thank you for your configuration.');
  await expect(page.locator('#copy-toast')).toBeVisible();
  await page.goto('/quick-start/');
  const example = page.locator('.code-block').filter({ has: page.locator('.code-heading > span', { hasText: 'profiles/focused.yaml' }) });
  await example.getByRole('button').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('extends: everyday\nconfig:\n  model: anthropic/your-review-model\n');
  await expect(example.getByRole('button')).toHaveAttribute('data-copy-state', 'copied');
  await expect(example.locator('.copied-glyph')).toBeVisible();
  await expect(example.locator('.copy-glyph')).toBeHidden();
  await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', { value: () => Promise.reject(new Error('Unavailable')) }));
  const first = page.locator('.code-block').first();
  await first.getByRole('button').click();
  expect(await page.evaluate(() => window.getSelection().toString())).toBe((await first.locator('code').textContent()).trimEnd());
  await expect(page.getByRole('status')).toContainText('Clipboard unavailable');
});

test('FAQ supports keyboard use and install blocks scroll instead of wrapping', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  const question = page.locator('.faq summary').first();
  await question.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.faq details').first()).toHaveAttribute('open', '');
  await expect(page.locator('.faq details').first()).toContainText('when available');
  await page.keyboard.press('Space');
  await expect(page.locator('.faq details').first()).not.toHaveAttribute('open');
  const code = page.locator('.hero pre');
  await expect(code).toHaveCSS('white-space', 'pre');
  await expect(code).toHaveCSS('overflow-x', 'auto');
  expect(await code.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await code.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => code.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
});

test('buttons lift against solid shadows and respect reduced motion and keyboard focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
   const primary = page.locator('.hero').getByRole('link', { name: 'Install', exact: true });
  const copy = page.locator('.copy-button').first();
  await expect(primary).toHaveCSS('animation-name', 'none');
  await primary.hover();
  await expect(primary).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -3, -3)');
  await expect(primary).toHaveCSS('box-shadow', 'rgb(19, 70, 134) 5px 5px 0px 0px');
  await expect(primary).toHaveCSS('border-radius', '8px');
  await page.mouse.down();
  await expect(primary).toHaveCSS('animation-name', 'none');
  await expect(primary).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 2, 2)');
  await expect(primary).toHaveCSS('box-shadow', 'rgb(19, 70, 134) 0px 0px 0px 0px');
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await copy.hover();
  await expect(copy).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -2, -2)');
  await expect(copy).toHaveCSS('box-shadow', 'rgb(19, 70, 134) 3px 3px 0px 0px');
  await expect(copy).toHaveCSS('border-radius', '8px');
  const coffee = page.locator('.coffee-link');
  await coffee.hover();
  await expect(coffee).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -3, -3)');
  await expect(coffee).toHaveCSS('box-shadow', 'rgb(9, 12, 16) 5px 5px 0px 0px');
  await page.mouse.move(0, 0);
  await page.keyboard.press('Tab');
  await primary.focus();
  await expect(primary).toBeFocused();
  await primary.hover();
  await expect(primary).toHaveCSS('animation-name', 'none');
  await expect(primary).toHaveCSS('transform', 'none');
  await expect(primary).toHaveCSS('outline-style', 'solid');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await copy.hover();
  await expect(copy).toHaveCSS('animation-name', 'none');
  await expect(copy).toHaveCSS('transform', 'none');
  await expect(copy).toHaveCSS('transition-duration', '0s');
  await primary.hover();
  await expect(primary).toHaveCSS('animation-name', 'none');
  await page.mouse.down();
  await expect(primary).toHaveCSS('transform', 'none');
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await page.goto('/quick-start/');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const tab = page.getByRole('tab', { name: 'Linux', exact: true });
  await tab.hover();
  await expect(tab).toHaveCSS('border-radius', '8px');
  await expect(tab).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -3, -3)');
  await expect(tab).toHaveCSS('box-shadow', 'rgb(19, 70, 134) 5px 5px 0px 0px');
});

test('shared navbar works on touch screens', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
  try {
    const page = await context.newPage();
     await page.goto('http://127.0.0.1:5175/docs/');
    const install = page.locator('.landing-nav').getByRole('link', { name: 'Install', exact: true });
    await install.tap();
    await expect(page).toHaveURL(/\/quick-start\/#install$/);
    await expect(install).toHaveCSS('animation-name', 'none');
    await expect(install).toHaveCSS('transform', 'none');
  } finally {
    await context.close();
  }
});

test('navigation, OS instructions, and examples work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5175/quick-start/');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.locator('#macos')).toBeVisible();
  await expect(page.locator('#linux')).toBeVisible();
  await expect(page.locator('.install-tablist')).toBeHidden();
  await expect(page.locator('.code-block')).toHaveCount(12);
  await expect(page.locator('.copy-button').first()).toBeHidden();
  await expect(page.locator('.prose')).toContainText('profiles/focused.yaml');
  await context.close();
});

test('shared navbar supports keyboard and cross-page navigation on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/quick-start/');
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(navigation).toBeVisible();
  await navigation.getByRole('link', { name: 'Docs', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/docs\/$/);
  await expect(page.locator('h1')).toHaveText('Using OCP');
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Docs', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('homepage topic links keep their new sections and legacy command redirect', async ({ page }) => {
  for (const route of ['commands']) {
    await page.goto(`/#${route}`);
    await expect(page).toHaveURL(new RegExp(`/docs/#${route}$`));
  }
  for (const section of ['profiles', 'machines']) {
    await page.goto(`/#${section}`);
    await expect(page).toHaveURL(new RegExp(`/#${section}$`));
    await expect(page.locator(`#${section}`)).toBeVisible();
  }
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`all pages fit the viewport and keep readable type at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
      expect(await page.locator('body').evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBe(width >= 1024 ? 20 : 18);
      if (route === '/quick-start/') {
        expect(await page.locator('pre').first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
        await page.screenshot({ path: `test-results/quick-start-${width}.png`, fullPage: true });
      }
      if (route === '/') {
        const desktop = await page.locator('.before .config-machine').first().boundingBox();
        const laptop = await page.locator('.before .config-machine').last().boundingBox();
        expect(laptop.x).toBeLessThan(desktop.x + desktop.width);
        expect(laptop.y).toBeLessThan(desktop.y + desktop.height);
        await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
      }
    }
  });
}

for (const width of [390, 1440]) {
  test(`system theme switches live on all pages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto(route);
      await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(252, 252, 250)');
      await page.emulateMedia({ colorScheme: 'dark' });
      await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
      await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(16, 25, 35)');
      await expect(page.locator('h1')).toHaveCSS('color', 'rgb(182, 213, 255)');
       await expect(page.locator('.landing-nav')).toHaveCSS('background-color', 'rgb(16, 45, 81)');
      await page.emulateMedia({ colorScheme: 'light' });
      await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
      await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(252, 252, 250)');
    }
  });

  test(`dark theme renders without JavaScript at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark', viewport: { width, height: 900 } });
    try {
      const page = await context.newPage();
      for (const base of ['http://127.0.0.1:5175', 'http://127.0.0.1:4175/ocp-site']) {
        await page.goto(`${base}/`);
        await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(16, 25, 35)');
        await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
        await expect(page.locator('h1')).toBeVisible();
      }
    } finally {
      await context.close();
    }
  });
}

for (const colorScheme of ['light', 'dark']) {
  for (const width of [390, 1440]) {
    test(`all pages pass automated WCAG A/AA checks in ${colorScheme} mode at ${width}px`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await page.goto(route);
        // Ghost filenames illustrate absent files, not readable UI content.
        // Their full-opacity “Missing” labels and the rest of the diagram stay checked.
        const results = await new AxeBuilder({ page })
          .exclude('.comparison .missing-file .file-name')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(results.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })), route).toEqual([]);
      }
    });
  }
}
