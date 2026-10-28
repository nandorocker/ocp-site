import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import { readFileSync } from 'node:fs';

export default function (config) {
  const markdown = new MarkdownIt({ html: true, linkify: false }).use(anchor, {
    level: [2, 3],
    slugify: (text) => text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-'),
  });
  markdown.renderer.rules.fence = (tokens, index) => {
    const token = tokens[index];
    const [language, ...title] = token.info.trim().split(/\s+/);
    const label = title.join(' ') || ({ sh: 'Terminal', bash: 'Terminal', yaml: 'YAML', text: 'Files' }[language] || 'Example');
    return `<div class="code-block"><div class="code-heading"><span>${markdown.utils.escapeHtml(label)}</span><button class="copy-button" type="button" hidden>Copy</button></div><pre tabindex="0" aria-label="${markdown.utils.escapeHtml(label)} example"><code>${markdown.utils.escapeHtml(token.content)}</code></pre></div>`;
  };
  config.setLibrary('md', markdown);
  config.setNunjucksEnvironmentOptions({ autoescape: true });
  // Keep initial layout independent of a separate CSS request, including in preview.
  config.addShortcode('siteStyles', () => readFileSync(new URL('./src/style.css', import.meta.url), 'utf8'));
  config.addFilter('toc', (html) => [...html.matchAll(/<h2\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)].map((match) => ({ id: match[1], title: match[2].replace(/<[^>]+>/g, '') })));
  config.addPassthroughCopy({ 'src': 'assets', 'public': '.' });
  config.addWatchTarget('src');
  config.addWatchTarget('public');
  return {
    dir: { input: 'site', output: process.env.SITE_OUTPUT_DIR || 'dist', includes: '_includes', data: '_data' },
    pathPrefix: process.env.SITE_BASE_PATH || '/ocp-site/',
    markdownTemplateEngine: false,
    htmlTemplateEngine: 'njk',
    templateFormats: ['md', 'njk'],
  };
}
