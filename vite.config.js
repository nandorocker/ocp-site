import { defineConfig } from 'vite';

// Serve real HTML pages; unknown documentation paths must not fall back to Home.
export default defineConfig({ appType: 'mpa' });
