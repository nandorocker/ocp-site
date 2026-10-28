import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('loads the handbook, assets, and valid internal links without script errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle('OCP — Your OpenCode setup, neatly kept.');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your OpenCode setup,neatly kept.');
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
  await expect(page.locator('.project-note').getByRole('link', { name: 'Nando Rossi' })).toHaveAttribute('href', 'https://nan.do');
  await expect(page.locator('.closing')).toContainText('Nando Rossi, the developer behind OCP.');
  const coffee = page.getByRole('link', { name: 'Buy me a coffee' });
  await expect(coffee).toHaveAttribute('href', 'https://buymeacoffee.com/nandorossi');
  await expect(coffee).toHaveAttribute('rel', 'noopener noreferrer');
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
  await page.getByText('How is this different from chezmoi?', { exact: true }).click();
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
