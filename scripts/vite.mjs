import Eleventy from '@11ty/eleventy';
import { createServer } from 'vite';

process.env.SITE_BASE_PATH = '/';
process.env.SITE_OUTPUT_DIR = '.site-dev';
const portIndex = process.argv.indexOf('--port');
const port = portIndex < 0 ? 5173 : Number(process.argv[portIndex + 1]);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Use --port followed by a valid port number.');
const site = new Eleventy('site', '.site-dev', { configPath: 'eleventy.config.js' });
await site.init();
await site.watch();
const server = await createServer({ root: '.site-dev', appType: 'mpa', server: { host: '127.0.0.1', port, strictPort: true } });
await server.listen();
server.printUrls();
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await server.close();
  await site.stopWatch();
  process.exit(0);
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
