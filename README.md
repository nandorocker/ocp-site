# OCP website

The standalone website for [OCP](https://github.com/nandorocker/ocp), by
[Nando Rossi](https://nan.do).

Production: **https://nandorocker.github.io/ocp-site/**

A small, static handbook and project introduction. Plain HTML, CSS, and JavaScript;
Vite is only the development server and build tool. This is separate from `ocp ui`.

```sh
git clone https://github.com/nandorocker/ocp-site.git
cd ocp-site
npm ci
npm run dev -- --port 5173 --strictPort
```

Development binds to `127.0.0.1`. On Windy, use the scanner-published Tailnet URL
and verify its port in the development catalog.

```sh
npm run build
npm run preview -- --port 4173 --strictPort
```

Publish the contents of `dist/` to a static host. The build uses relative asset
paths, so it also works below a subpath. No account, analytics, backend, or secret
configuration is required. Fonts are requested from Google Fonts, with system
fallbacks when unavailable.

The GitHub summary requests the OCP repository's public release, star, and fork
metadata directly from GitHub's API, without credentials. If requests fail or
are rate-limited, descriptive labels remain instead of fabricated counts. The
repository link still works without JavaScript.

The logo in `public/logo.png` comes from the OCP project's `docs/logo.png`;
update this copy if the project logo changes. Content is in `index.html`, styles in `src/style.css`,
and progressive enhancements in `src/main.js`.

## Checks

```sh
npx playwright install chromium
npm test
```

Tests build the site first, then cover profile tabs, clipboard success and
fallback, mobile navigation, FAQ state, internal links, five viewport widths,
JavaScript-disabled examples, and automated WCAG A/AA checks. A production smoke
test checks built assets and interactions under `/ocp-site/`. Tests start separate
loopback servers on ports 5175 and 4175 and save layout screenshots in the ignored
`test-results/` directory.

Before publishing, check installation and configuration examples against the
release being announced. Placeholder model and repository names are intentional.
This site does not claim cross-harness support or automatic credential syncing.

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
