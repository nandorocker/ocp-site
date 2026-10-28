import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.route('https://api.github.com/repos/nandorocker/ocp', (route) => route.fulfill({
    json: { stargazers_count: 22100, forks_count: 698 },
  }));
  await page.route('https://api.github.com/repos/nandorocker/ocp/releases/latest', (route) => route.fulfill({
    json: { tag_name: 'v0.1.2' },
  }));
});

test('loads the handbook, assets, and valid internal links without script errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle('OCP — Your coding-agent config. Every machine.');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your coding-agent config.Every machine.');
  await expect(page.locator('.sidebar-description')).toHaveText('Thank you for your configuration.');
  await expect(page.locator('.mobile-motto')).toHaveText('Thank you for your configuration.');
  await expect(page.locator('.hero .harness-note')).toHaveText('Currently works with OpenCode; other harnesses coming soon!');
  await expect(page.locator('.harness-note a')).toHaveAttribute('href', 'https://opencode.ai/');
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(navigation.locator('.nav-heading')).toHaveCount(0);
  await expect(navigation.getByRole('link', { name: 'Source on GitHub' })).toHaveCount(0);
  await expect(navigation.getByRole('link', { name: 'Feedback & ideas' })).toHaveCount(1);
  await expect(navigation.locator('.active')).toHaveCSS('font-weight', '800');
  await expect(navigation.locator('.active')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(navigation.locator('.active .nav-symbol')).toHaveCSS('fill', 'rgb(32, 57, 81)');
  expect(await page.locator('.desktop-brand img').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await page.locator('a[href^="#"]').evaluateAll((links) => links.every((link) => document.getElementById(link.hash.slice(1))))).toBe(true);
  expect(errors).toEqual([]);
});

test('profile tabs work with pointer and keyboard', async ({ page }) => {
  await page.goto('/#profiles');
  const focused = page.getByRole('tab', { name: 'focused', exact: true });
  const everyday = page.getByRole('tab', { name: 'everyday', exact: true });
  await focused.click();
  await expect(page.getByRole('tabpanel')).toContainText('extends: everyday');
  await expect(focused).toHaveAttribute('aria-selected', 'true');
  await focused.press('ArrowLeft');
  await expect(everyday).toBeFocused();
  await expect(everyday).toHaveAttribute('aria-selected', 'true');
  await everyday.press('End');
  await expect(focused).toBeFocused();
});

test('credits Nando and links to the same coffee page as BouncyGen', async ({ page }) => {
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
  await expect(page.locator('.sidebar-credit .coffee-link-mini')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('↗');
});

test('repository summary displays release, stars, and forks without the old tagline', async ({ page }) => {
  await page.goto('/');
  const summary = page.getByRole('link', { name: 'OCP on GitHub' });
  await expect(summary).toHaveAttribute('href', 'https://github.com/nandorocker/ocp');
  await expect(summary).toContainText('nandorocker/ocp');
  await expect(summary.locator('[data-repository="release"]')).toHaveText('v0.1.2');
  await expect(summary.locator('[data-repository="stars"]')).toHaveText('22.1K');
  await expect(summary.locator('[data-repository="stars"]')).toHaveAttribute('aria-label', '22100 stars');
  await expect(summary.locator('[data-repository="forks"]')).toHaveText('698');
  await expect(page.getByText('Small project. Open source.', { exact: true })).toHaveCount(0);
});

test('unavailable GitHub metadata leaves labels and does not break the controls', async ({ page }) => {
  await page.unroute('https://api.github.com/repos/nandorocker/ocp');
  await page.unroute('https://api.github.com/repos/nandorocker/ocp/releases/latest');
  await page.route('https://api.github.com/repos/nandorocker/ocp', (route) => route.fulfill({ status: 403, json: {} }));
  await page.route('https://api.github.com/repos/nandorocker/ocp/releases/latest', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('[data-repository="release"]')).toHaveText('Releases');
  await expect(page.locator('[data-repository="stars"]')).toHaveText('Stars');
  await expect(page.locator('[data-repository="forks"]')).toHaveText('Forks');
  await page.getByRole('tab', { name: 'focused', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('extends: everyday');
});

test('repository metadata supports zero counts and rejects invalid values', async ({ page }) => {
  await page.unroute('https://api.github.com/repos/nandorocker/ocp');
  await page.unroute('https://api.github.com/repos/nandorocker/ocp/releases/latest');
  await page.route('https://api.github.com/repos/nandorocker/ocp', (route) => route.fulfill({ json: { stargazers_count: 0, forks_count: -1 } }));
  await page.route('https://api.github.com/repos/nandorocker/ocp/releases/latest', (route) => route.fulfill({ json: { tag_name: 123 } }));
  await page.goto('/');
  await expect(page.locator('[data-repository="stars"]')).toHaveText('0');
  await expect(page.locator('[data-repository="forks"]')).toHaveText('Forks');
  await expect(page.locator('[data-repository="release"]')).toHaveText('Releases');
});

test('copy uses only the selected profile', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#profiles');
  await page.getByRole('tab', { name: 'focused', exact: true }).click();
  await page.getByRole('button', { name: 'Copy focused profile', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('extends: everyday\nconfig:\n  model: anthropic/your-review-model');
  await expect(page.getByRole('button', { name: 'Copy focused profile', exact: true })).toHaveText('Copied');
});

test('copy failure selects the code and explains the fallback', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', { value: () => Promise.reject(new Error('Unavailable')) }));
  await page.getByRole('button', { name: 'Copy setup command', exact: true }).click();
  expect(await page.evaluate(() => window.getSelection().toString())).toBe('ocp setup');
  await expect(page.getByRole('status')).toContainText('Clipboard unavailable');
});

test('FAQ and navigation expose their current state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Common questions', exact: true }).click();
  await expect(page).toHaveURL(/#questions$/);
  await expect(page.getByRole('link', { name: 'Common questions', exact: true })).toHaveAttribute('aria-current', 'location');
  await page.getByText('Do I have to keep every machine identical?', { exact: true }).click();
  await expect(page.locator('details').first()).toHaveAttribute('open', '');
});

test('both profile files remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5175/');
  await expect(page.locator('#panel-everyday')).toBeVisible();
  await expect(page.locator('#panel-focused')).toBeVisible();
  await expect(page.getByRole('tablist')).toBeHidden();
  await context.close();
});

test('production build loads assets and enhancements under a subpath', async ({ page }) => {
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith('http://127.0.0.1:4175/') && response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4175/ocp-site/');
  await expect(page.locator('.sidebar')).toHaveCSS('position', 'fixed');
  expect(await page.locator('.desktop-brand img').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.getByRole('tab', { name: 'focused', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('extends: everyday');
  expect(await page.locator('script').evaluateAll((scripts) => scripts.every((script) => !script.src.includes('/@vite/')))).toBe(true);
  expect(failures).toEqual([]);
});

test('mobile menu supports navigation and Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Menu' });
  await expect(page.getByRole('navigation')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.getByRole('link', { name: 'Working with profiles', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page).toHaveURL(/#profiles$/);
  await expect(page.getByRole('heading', { name: 'One source. A few ways to work.' })).toBeFocused();
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`layout stays within the viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const fontSize = (selector) => page.locator(selector).first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    expect(await fontSize('body')).toBe(width >= 1024 ? 20 : 18);
    expect(await fontSize('.steps p')).toBeGreaterThanOrEqual(18);
    expect(await fontSize('.hero-description')).toBeGreaterThanOrEqual(18);
    expect(await fontSize('pre')).toBeGreaterThanOrEqual(14);
    expect(await fontSize('.small')).toBeGreaterThanOrEqual(15);
    await page.screenshot({ path: `test-results/ocp-${width}.png`, fullPage: true });
  });
}

for (const width of [390, 1440]) {
  test(`has no automated WCAG A/AA violations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }))).toEqual([]);
  });
}
