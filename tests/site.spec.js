import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/docs/', '/install/', '/quick-start/'];
test.beforeEach(async ({ page }) => {
  await page.route('https://api.github.com/repos/nandorocker/ocp', (route) => route.fulfill({ json: { stargazers_count: 22100, forks_count: 698 } }));
  await page.route('https://api.github.com/repos/nandorocker/ocp/releases/latest', (route) => route.fulfill({ json: { tag_name: 'v0.1.2' } }));
});

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
      expect(await page.locator('.desktop-brand img').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await page.locator('link[href$="/assets/style.css"]').evaluate((link) => Boolean(link.sheet))).toBe(true);
      const ids = await page.locator('[id]').evaluateAll((elements) => elements.map((element) => element.id));
      expect(new Set(ids).size).toBe(ids.length);
      {
        const active = page.locator('.sidebar [aria-current="page"]');
        await expect(active).toHaveCount(1);
        await expect(active).toHaveAttribute('href', `${base.includes('4175') ? '/ocp-site' : ''}${route}`);
        await expect(active).toHaveCSS('font-weight', '800');
        await expect(active).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      }
    }
    expect(failures).toEqual([]);
  });
}

test('keeps the homepage concise and support status prominent', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('OCP — Your coding-agent config. Every machine.');
  await expect(page.locator('.hero .harness-note')).toHaveText('Currently works with OpenCode; other harnesses coming soon!');
  await expect(page.locator('.sidebar-description')).toHaveText('Thank you for your configuration.');
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(252, 252, 250)');
  await expect(page.locator('.sidebar')).toHaveCSS('background-color', 'rgb(49, 91, 140)');
  await expect(page.locator('.sidebar .active')).toHaveCSS('color', 'rgb(245, 235, 221)');
  await expect(page.locator('.hero').getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '#getting-started');
  await expect(page.locator('.hero').getByRole('link', { name: 'Read the docs' })).toHaveAttribute('href', '/docs/');
  await expect(page.locator('main pre')).toHaveCount(3);
  await expect(page.locator('#getting-started')).toContainText('~/.local/bin/ocp setup');
  await expect(page.locator('#getting-started')).toContainText('opencode');
  await expect(page.locator('.sidebar nav .nav-link')).toHaveCount(5);
  await expect(page.locator('main')).toContainText('T3');
  expect((await page.locator('main').innerText()).split(/\s+/).length).toBeLessThan(750);
});

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
    const assets = await page.locator('img[src], script[src], link[rel="stylesheet"]').evaluateAll((elements) => elements.map((element) => element.src || element.href));
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
  await page.goto('/install/');
  await expect(page.getByRole('heading', { name: 'macOS', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Linux', exact: true })).toBeVisible();
  await expect(page.locator('.prose')).toContainText("Native Windows isn't supported yet.");
  await page.goto('/quick-start/');
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
  await expect(page.locator('.sidebar-credit').getByRole('link', { name: 'Nando Rossi' })).toHaveAttribute('href', 'https://nan.do');
  await expect(page.locator('.closing')).toContainText('Nando Rossi, the developer behind OCP.');
  const coffees = page.getByRole('link', { name: 'Buy me a coffee', exact: true });
  await expect(coffees).toHaveCount(2);
  for (const coffee of await coffees.all()) {
    await expect(coffee).toHaveAttribute('href', 'https://buymeacoffee.com/nandorossi');
    await expect(coffee).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(coffee).toHaveCSS('background-color', 'rgb(255, 221, 0)');
    await expect(coffee).toHaveCSS('color', 'rgb(26, 18, 8)');
    await expect(coffee).toHaveCSS('border-radius', '8px');
  }
  await coffees.last().hover();
  await expect(coffees.last()).toHaveCSS('animation-name', 'none');
});

test('repository summary displays real response values and leaves fallbacks on failure', async ({ page }) => {
  await page.goto('/');
  const summary = page.getByRole('link', { name: 'OCP on GitHub' });
  await expect(summary).toHaveAttribute('href', 'https://github.com/nandorocker/ocp');
  await expect(summary.locator('[data-repository="release"]')).toHaveText('v0.1.2');
  await expect(summary.locator('[data-repository="stars"]')).toHaveText('22.1K stars');
  await expect(summary.locator('[data-repository="forks"]')).toHaveText('698 forks');
  await page.route('https://api.github.com/repos/nandorocker/ocp', (route) => route.fulfill({ status: 403, json: {} }));
  await page.route('https://api.github.com/repos/nandorocker/ocp/releases/latest', (route) => route.abort());
  await page.reload();
  await expect(summary.locator('[data-repository="release"]')).toHaveText('Releases');
  await expect(summary.locator('[data-repository="stars"]')).toHaveText('Stars');
  await page.getByRole('link', { name: 'Quick start', exact: true }).click();
  await expect(page).toHaveURL(/\/quick-start\/$/);
  await expect(page.locator('.copy-button').first()).toBeVisible();
});

test('repository metadata accepts zero but rejects malformed values', async ({ page }) => {
  await page.route('https://api.github.com/repos/nandorocker/ocp', (route) => route.fulfill({ json: { stargazers_count: 0, forks_count: -1 } }));
  await page.route('https://api.github.com/repos/nandorocker/ocp/releases/latest', (route) => route.fulfill({ json: { tag_name: 123 } }));
  await page.goto('/');
  await expect(page.locator('[data-repository="stars"]')).toHaveText('0 stars');
  await expect(page.locator('[data-repository="forks"]')).toHaveText('Forks');
  await expect(page.locator('[data-repository="release"]')).toHaveText('Releases');
});

test('copies the chosen example and reports a clipboard fallback', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Copy Set up OCP example', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('~/.local/bin/ocp setup');
  await page.goto('/quick-start/');
  const example = page.locator('.code-block').filter({ has: page.locator('.code-heading > span', { hasText: 'profiles/focused.yaml' }) });
  await example.getByRole('button').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('extends: everyday\nconfig:\n  model: anthropic/your-review-model\n');
  await expect(example.getByRole('button')).toHaveText('Copied');
  await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', { value: () => Promise.reject(new Error('Unavailable')) }));
  const first = page.locator('.code-block').first();
  await first.getByRole('button').click();
  expect(await page.evaluate(() => window.getSelection().toString())).toBe((await first.locator('code').textContent()).trimEnd());
  await expect(page.getByRole('status')).toContainText('Clipboard unavailable');
});

test('navigation, OS instructions, and examples work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5175/install/');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.locator('#macos')).toBeVisible();
  await expect(page.locator('#linux')).toBeVisible();
  await page.getByRole('link', { name: 'Quick start', exact: true }).click();
  await expect(page.locator('.code-block')).toHaveCount(8);
  await expect(page.locator('.copy-button').first()).toBeHidden();
  await expect(page.locator('.prose')).toContainText('profiles/focused.yaml');
  await context.close();
});

test('mobile menu supports Escape and cross-page navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Menu' });
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(navigation).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await navigation.getByRole('link', { name: 'Documentation', exact: true }).click();
  await expect(page).toHaveURL(/\/docs\/$/);
  await expect(page.locator('h1')).toHaveText('Using OCP');
  await expect(navigation).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('legacy homepage section links reach their replacement pages', async ({ page }) => {
  for (const route of ['profiles', 'machines', 'commands']) {
    await page.goto(`/#${route}`);
    await expect(page).toHaveURL(new RegExp(`/docs/#${route}$`));
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
      if (route === '/') await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
    }
  });
}

for (const width of [390, 1440]) {
  test(`all pages pass automated WCAG A/AA checks at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(results.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })), route).toEqual([]);
    }
  });
}
