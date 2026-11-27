# arjun7965.github.io

[![CI](https://github.com/arjun7965/arjun7965.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/arjun7965/arjun7965.github.io/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/arjun7965/arjun7965.github.io/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/arjun7965/arjun7965.github.io/actions/workflows/pages/pages-build-deployment)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Farjunvinod.com&label=arjunvinod.com)](https://arjunvinod.com)

Personal website for Arjun Vinod, a Firmware Engineer based in Silicon Valley.

🔗 **Live Site**: [https://arjunvinod.com](https://arjunvinod.com)

## About

This repository hosts a personal portfolio website built with vanilla HTML, CSS, and JavaScript. The site features:

- **Modern Minimalist Design**: Clean, professional aesthetic with navy/teal accent colors
- **Professional Profile**: Experience and education displayed in an elegant vertical timeline
- **Reading List**: Curated collection of books spanning macroeconomics, financial systems, psychology, philosophy, and personal growth
- **Theme Toggle**: Light/dark mode with system preference detection and persistent user choice
- **Responsive Design**: Mobile-friendly layout with CSS custom properties for consistent theming

## Pages

### [index.html](https://arjunvinod.com/)
Main landing page featuring:
- Concise professional introduction
- Modern vertical timeline with connecting lines and animated dots
- Work experience at Astera Labs, Qualcomm Atheros, and GreenSight Agronomics
- Educational background from Syracuse University and KCG College of Technology
- Social media links and contact information

### [books/](https://arjunvinod.com/books/)
Reading list with:
- Self-hosted book covers (`images/covers/`), fetched once from the Open Library Covers API at build time — no runtime third-party requests
- List markup pre-rendered into static HTML for SEO and no-JS visitors
- "Currently Reading" badge for in-progress books
- Theme-aware placeholder generation for missing covers
- Book descriptions and Amazon/ThriftBooks links

## Design

The site uses a modern minimalist design language:

- **Color Palette**: Navy blue (#0f4c75) primary with teal (#14b8a6) accents
- **Typography**: Self-hosted Inter and JetBrains Mono (latin woff2 subsets in `fonts/`), system font stack as fallback
- **Icons**: Inline SVGs for social links and UI elements
- **Timeline**: Vertical timeline with gradient connecting lines and glowing dots
- **Cards**: Subtle shadows with hover animations and gradient accent bars
- **Accessibility**: WCAG 2.2 AA color contrast in both themes, enforced by axe-core scans in CI

## Technical Features

- **No Build Process**: Pure HTML/CSS/JavaScript - no frameworks or bundlers required
- **Accessibility**: ARIA labels, skip links, semantic HTML, keyboard navigation, `prefers-reduced-motion` support, axe-core WCAG 2.2 A/AA checks in CI
- **Performance**: Lazy loading, self-hosted covers with fixed aspect ratio (no layout shift), self-hosted fonts (no third-party requests)
- **SEO**: Meta tags, Open Graph, Twitter Cards, canonical URLs, pre-rendered content
- **PWA Ready**: Web manifest and favicon set with multiple sizes for all platforms
- **Analytics**: [GoatCounter](https://www.goatcounter.com/) — privacy-friendly, no cookies, GDPR-compliant. Dashboard at [arjunvinod.goatcounter.com](https://arjunvinod.goatcounter.com)
- **CI**: GitHub Actions runs linting, unit tests, Playwright smoke and accessibility tests, and Lighthouse audits on every PR and push to master

## Structure

```
.
├── index.html              # Main page
├── books/
│   └── index.html          # Reading list (served at /books/), list pre-rendered by scripts/render-books.js
├── 404.html                # Custom 404 page
├── robots.txt              # Crawler directives and sitemap pointer
├── sitemap.xml             # Sitemap for SEO
├── site.webmanifest        # PWA manifest
├── css/
│   └── styles.css          # Shared styles, theme system, @font-face rules
├── fonts/                  # Self-hosted Inter (variable) and JetBrains Mono woff2
├── js/
│   ├── books.js            # READING_LIST data, ISBN helpers, cover fallback wiring
│   ├── site.js             # Copyright year and scroll-reveal animations
│   └── theme.js            # Theme toggle and persistence
├── scripts/
│   ├── fetch-covers.js     # Downloads missing covers from Open Library into images/covers/
│   └── render-books.js     # Bakes the reading list into books/index.html
├── test/
│   ├── books.test.js             # Unit tests for ISBN helpers, covers, and rendered HTML
│   ├── site-integrity.test.js    # Invariants for CSP hashes, metadata, manifest, and sitemap
│   └── workflow-security.test.js # GitHub Actions SHA-pinning and permission checks
├── e2e/
│   ├── home.spec.js        # Playwright smoke tests: timeline, theme toggle, navigation, no-JS
│   ├── books.spec.js       # Playwright smoke tests: covers, placeholders, no-JS
│   ├── layout.spec.js      # Viewport fit, skip links, mobile footer, print styles
│   ├── not-found.spec.js   # Playwright smoke tests: 404 page from nested URLs
│   ├── theme.spec.js       # Theme storage resilience and deferred-script fallback tests
│   ├── a11y.spec.js        # axe-core WCAG 2.2 A/AA scans and hover contrast checks
│   └── utils.js            # Shared helpers (external request blocking, error tracking)
├── images/
│   ├── covers/             # Self-hosted book covers, named by primary ISBN
│   ├── organizations/      # Self-hosted company and university marks
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── books-og.png
│   └── og-image.png
├── .github/
│   ├── dependabot.yml      # Weekly grouped updates for npm dev deps and Actions
│   └── workflows/
│       ├── ci.yml          # Lint, unit tests, e2e, and Lighthouse on every PR/push
│       └── claude.yml      # Maintainer-gated Claude Code assistant workflow
├── package.json            # Dev dependencies (linting, testing, Lighthouse)
├── .htmlhintrc             # HTMLHint configuration
├── .stylelintrc.json       # Stylelint configuration
├── eslint.config.js        # ESLint flat configuration
├── playwright.config.js    # Playwright configuration (starts its own server)
└── lighthouserc.js         # Lighthouse CI configuration
```

## Local Development

Start a local web server:

```bash
python3 -m http.server 4000
```

Then visit [http://localhost:4000](http://localhost:4000)

### Linting, Testing & Auditing

```bash
npm run lint          # HTMLHint + Stylelint + ESLint (HTML, CSS & JS)
npm run lint:html     # HTMLHint only
npm run lint:css      # Stylelint only
npm run lint:js       # ESLint only
npm test              # Unit tests (node:test) for the ISBN helpers in js/books.js
npm run test:e2e      # Playwright smoke tests; starts its own server on port 4000
npm run lighthouse    # Lighthouse CI (requires local server on port 4000)
```

All of the above also run in CI (`.github/workflows/ci.yml`) on every PR and push to master.

### Adding a Book

1. Add the entry to `READING_LIST` in `js/books.js`.
2. Run `node scripts/fetch-covers.js` to download its cover into `images/covers/`.
3. Run `node scripts/render-books.js` to bake the updated list into `books/index.html`.
4. Commit the cover image and regenerated HTML together — unit tests fail if either is missing or stale.

### Dependency Overrides

`package.json` pins patched versions of several transitive dev dependencies via the npm `overrides` field, avoiding breaking major bumps of the direct deps that pull them in:

| Package | Pinned to |
|---|---|
| `brace-expansion` | `^5.0.12` |
| `tmp` | `^0.2.7` |
| `uuid` | `^14.0.0` |
| `fast-uri` | `^3.1.2` |
| `ip-address` | `^10.1.1` |
| `postcss` | `^8.5.25` |
| `chrome-launcher` | `^1.2.1` |
| `glob` | `^14.0.6` |
| `lighthouse` | `13.4.1` |
| `minimatch` | `^11.0.8` |
| `qs` | `^6.16.0` |

Run `npm audit` after `npm install` to verify 0 vulnerabilities.

> **Known dev-tool bundle note ([#110](https://github.com/arjun7965/arjun7965.github.io/issues/110)):** While `node_modules/minimatch` resolves to `11.0.9`, `glob@14.0.6` (the latest published release) still resolves CommonJS `require("glob")` (used by `htmlhint`) to `./dist/commonjs/index.min.js`, which bundles an inlined `minimatch` `11.0.5` snapshot affected by [`GHSA-cf2h-pxjq-68xw`](https://github.com/isaacs/minimatch/security/advisories/GHSA-cf2h-pxjq-68xw) and [`GHSA-hqmv-qgp3-jx75`](https://github.com/isaacs/minimatch/security/advisories/GHSA-hqmv-qgp3-jx75). Exposure is limited to local/CI linting with fixed file paths (`htmlhint index.html books/index.html 404.html`, never untrusted glob patterns) until upstream publishes a `glob` release rebuilt with `minimatch >= 11.0.8`.

## Technologies

- HTML5 with semantic markup
- CSS3 with custom properties (CSS variables) for theming
- Vanilla JavaScript (ES6+)
- [Inter](https://rsms.me/inter/) and [JetBrains Mono](https://www.jetbrains.com/lp/mono/), self-hosted as latin woff2 subsets
- Open Library Covers API for fetching book covers at build time (self-hosted thereafter)
- HTMLHint, Stylelint, ESLint, node:test, Playwright, and Lighthouse CI for quality assurance

## Theme System

The site implements a comprehensive theme toggle:
- Auto-detects system preference on first visit
- Persists user selection in `localStorage`
- Emits custom `themeChanged` event for reactive components
- CSS custom properties enable instant theme switching

## Contact

- **Email**: [arjun@arjunvinod.com](mailto:arjun@arjunvinod.com)
- **LinkedIn**: [linkedin.com/in/avinod](https://linkedin.com/in/avinod)
- **GitHub**: [github.com/arjun7965](https://github.com/arjun7965)
- **X (Twitter)**: [twitter.com/arjun7965](https://twitter.com/arjun7965)

## License

© 2026 Arjun Vinod. All rights reserved.
