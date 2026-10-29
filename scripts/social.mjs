import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// Regenerate the checked-in share image after changing the headline or hero art.
const illustration = await readFile(new URL('../public/ocp-portability.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<html lang="en"><style>
    * { box-sizing: border-box; } body { margin: 0; background: #fcfcfa; color: #134686; font-family: Georgia, serif; }
    main { width: 1200px; height: 630px; padding: 58px; display: flex; align-items: center; gap: 20px; border-top: 16px solid #134686; }
    .copy { width: 510px; } b { font: bold 36px monospace; } h1 { font-size: 59px; line-height: 1.08; font-weight: normal; margin: 28px 0; }
    p { font: 22px/1.4 sans-serif; } svg { width: 560px; flex-shrink: 0; }
    </style><main><div class="copy"><b>OCP<span style="color:#feb21a">.</span></b><h1>Take your coding agent setup anywhere you work.</h1><p>One source. Every machine. Any profile.</p></div>${illustration}</main></html>`);
  await page.screenshot({ path: new URL('../public/ocp-social.png', import.meta.url).pathname });
} finally {
  await browser.close();
}
