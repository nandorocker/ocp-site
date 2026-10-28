# OCP website

The standalone website for [OCP](https://github.com/nandorocker/ocp), by
[Nando Rossi](https://nan.do).

Production: **https://nandorocker.github.io/ocp-site/**

A static introduction and documentation site. Eleventy renders Markdown and
Nunjucks layouts to HTML; Vite serves local development and build previews.
The browser uses plain CSS and JavaScript, with no client-side router, analytics,
accounts, or backend. This website is separate from the local `ocp ui` editor.

```sh
git clone https://github.com/nandorocker/ocp-site.git
cd ocp-site
npm ci
npm run dev -- --port 5173 --strictPort
```

Development binds to `127.0.0.1` and refuses an occupied port. The development
script watches Eleventy content, writes to the ignored `.site-dev/`, and serves
that directory with Vite. On Windy, use the scanner-published Tailnet URL and
verify its port in the development catalog. Do not start a duplicate listener.

```sh
npm run build
npm run preview -- --base=/ocp-site/ --port 4173 --strictPort
```

The default production path prefix is `/ocp-site/`, matching GitHub Pages. Preview
that build with `npm run preview -- --base=/ocp-site/ --port 4173 --strictPort`,
then open `/ocp-site/`. For a host serving from the domain root, build with
`SITE_BASE_PATH=/ npm run build`; another subpath can be supplied the same way.
Publish the contents of `dist/`. Fonts are requested from Google Fonts, with
system fallbacks when unavailable.

The GitHub summary requests the OCP repository's public release, star, and fork
metadata directly from GitHub's API, without credentials. If requests fail or
are rate-limited, descriptive labels remain instead of fabricated counts. The
repository link still works without JavaScript.

## Editing content

The retro palette comes from [Color Hunt](https://colorhunt.co/palette/f5ebddf2765e315b8c413333):
cream `#F5EBDD`, coral `#F2765E`, blue `#315B8C`, and dark brown `#413333`.
The sidebar uses deep blue with light text; reading surfaces use near-white
`#FCFCFA`, with cool neutral code blocks. Cream is reserved for sidebar text and
coral for small accents. Coffee buttons retain BouncyGen's independent `#FFDD00`
styling.

- `site/index.njk`: short homepage.
- `site/install.md`: OS-specific installation.
- `site/quick-start.md`: the concept-led first-profile walkthrough.
- `site/docs.md`: deeper guidance and command/configuration reference on one page.
  Markdown pages have a title, description, `navKey`, and explicit permalink in
  YAML frontmatter. The homepage includes working installation and setup steps.
- `site/_includes/`: shared page layout, sidebar, footer, and illustrations.
- `site/_data/navigation.js`: navigation labels, destinations, and active-page keys.
- `src/style.css`: shared typography, responsive layouts, and component styles.
- `src/main.js`: mobile menu, example copying, and legacy homepage-anchor links.
- `eleventy.config.js`: Markdown rendering, heading IDs, contents lists, and assets.

Use relative sibling links in Markdown (`../profiles/`), and Eleventy's `url`
filter for template links and assets. Headings generate IDs with punctuation
removed. Installation sections, examples, and navigation remain usable without
JavaScript. Old homepage `#profiles`, `#machines`, and `#commands` links lead to
their new guides with JavaScript; without it, matching links appear on the home page.

The logo in `public/logo.png` comes from the OCP project's `docs/logo.png`.
Update this copy if the project logo changes.

## Checks

```sh
npx playwright install chromium
npm test
```

Tests build the site first, then load every page directly in development and
under the production `/ocp-site/` prefix. They check internal links and anchors,
assets, active navigation, OS instructions, clipboard success/fallback, author
and support links, repository metadata failure modes, legacy links, no-JavaScript
access, five viewport widths, and automated WCAG A/AA checks on every page.
Tests start separate loopback servers on ports 5175 and 4175 and save layout
screenshots in the ignored `test-results/` directory.

Before publishing, check instructions and examples against the release being
documented, not just its PRD. Placeholder model and repository names are labeled.
Verify OS-specific installation on the platforms claimed; a Linux test does not
establish macOS or WSL runtime coverage. Never test setup/reset against a real
user HOME. The site distinguishes current OpenCode support from planned harnesses,
and explains OCP's role alongside T3 without claiming it manages T3 configuration.

## GitHub Pages

`.github/workflows/pages.yml` runs the browser tests on pull requests and pushes
to `main`. A successful push to `main` builds and deploys `dist/` to GitHub Pages.
It can also be run manually. Repository **Settings → Pages → Source** must be
**GitHub Actions**. No custom domain or Windy production service is configured.

Deployment permissions are limited to the deployment job. Pull requests only run
checks and cannot deploy. To roll back, revert the relevant source commit and
push the revert to `main`; the last successful deployment remains live if checks
fail before deployment.

## License

AGPL-3.0, matching OCP. See [LICENSE](LICENSE).
