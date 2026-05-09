# arjun7965.github.io

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
- Dynamic book cover loading from Open Library API with ISBN fallbacks
- "Currently Reading" badge for in-progress books
- Theme-aware placeholder generation for missing covers
- Book descriptions and Amazon/ThriftBooks links

## Design

The site uses a modern minimalist design language:

- **Color Palette**: Navy blue (#0f4c75) primary with teal (#14b8a6) accents
- **Typography**: Inter (Google Fonts) with JetBrains Mono for monospace, system font stack as fallback
- **Icons**: Inline SVGs for social links and UI elements
- **Timeline**: Vertical timeline with gradient connecting lines and glowing dots
- **Cards**: Subtle shadows with hover animations and gradient accent bars
- **Accessibility**: High contrast colors in both light and dark modes

## Technical Features

- **No Build Process**: Pure HTML/CSS/JavaScript - no frameworks or bundlers required
- **Accessibility**: ARIA labels, skip links, semantic HTML, keyboard navigation
- **Performance**: Lazy loading, preconnect hints, optimized asset loading
- **SEO**: Meta tags, Open Graph, Twitter Cards, canonical URLs
- **PWA Ready**: Web manifest and favicon set with multiple sizes for all platforms
- **Analytics**: [GoatCounter](https://www.goatcounter.com/) — privacy-friendly, no cookies, GDPR-compliant. Dashboard at [arjunvinod.goatcounter.com](https://arjunvinod.goatcounter.com)

## Structure

```
.
├── index.html              # Main page
├── books/
│   └── index.html          # Reading list (served at /books/)
├── 404.html                # Custom 404 page
├── sitemap.xml             # Sitemap for SEO
├── site.webmanifest        # PWA manifest
├── css/
│   └── styles.css          # Shared styles and theme system
├── js/
│   ├── books.js            # Book cover loading and ISBN fallback logic
│   ├── menu.js             # Mobile menu dropdown logic
│   └── theme.js            # Theme toggle and persistence
├── images/
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   └── og-image.png
├── package.json            # Dev dependencies (linting, Lighthouse)
├── .htmlhintrc             # HTMLHint configuration
├── .stylelintrc.json       # Stylelint configuration
└── lighthouserc.js         # Lighthouse CI configuration
```

## Local Development

Start a local web server:

```bash
python3 -m http.server 4000
```

Then visit [http://localhost:4000](http://localhost:4000)

### Linting & Auditing

```bash
npm run lint          # HTMLHint + Stylelint (HTML & CSS)
npm run lint:html     # HTMLHint only
npm run lint:css      # Stylelint only
npm run lighthouse    # Lighthouse CI (requires local server on port 4000)
```

### Dependency Overrides

`package.json` pins patched versions of several transitive dev dependencies via the npm `overrides` field, avoiding breaking major bumps of the direct deps that pull them in:

| Package | Pinned to | Resolves |
|---|---|---|
| `tmp` | `^0.2.4` | CVE-2025-54798 (symlink) |
| `uuid` | `^14.0.0` | GHSA-w5hq-g745-h8pq (buffer bounds) |
| `fast-uri` | `^3.1.2` | GHSA-v39h-62p7-jpjc (host confusion), GHSA-q3j6-qgpj-74h6 (path traversal) |
| `ip-address` | `^10.1.1` | GHSA-v2v4-37r5-5v8g (Address6 XSS) |
| `basic-ftp` | `^5.3.1` | GHSA-rpmf-866q-6p89 (DoS) |
| `postcss` | `^8.5.10` | GHSA-qx2v-qp2m-jg93 (XSS via `</style>`) |

Run `npm audit` after `npm install` to verify 0 vulnerabilities.

## Technologies

- HTML5 with semantic markup
- CSS3 with custom properties (CSS variables) for theming
- Vanilla JavaScript (ES6+)
- [Inter](https://fonts.google.com/specimen/Inter) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via Google Fonts
- Open Library Covers API for book images
- HTMLHint, Stylelint, and Lighthouse CI for quality assurance

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
