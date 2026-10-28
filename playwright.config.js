import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:5175', reducedMotion: 'reduce' },
  webServer: [{
    command: 'npm run dev -- --port 5175 --strictPort',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: false,
  }, {
    command: 'npm run preview -- --base=/ocp-site/ --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175/ocp-site/',
    reuseExistingServer: false,
  }],
});
