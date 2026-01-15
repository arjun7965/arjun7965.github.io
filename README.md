# arjun7965.github.io

Personal website for Arjun Vinod, a Firmware Engineer based in Silicon Valley.

🔗 **Live Site**: [https://arjunvinod.com](https://arjunvinod.com)

## About

This repository hosts a personal portfolio website built with vanilla HTML, CSS, and JavaScript. The site features:

- **Modern Minimalist Design**: Clean, professional aesthetic with navy/teal accent colors
- **Professional Profile**: Experience and education displayed in an elegant vertical timeline
- **Reading List**: Curated collection of books on macroeconomics, financial systems, and monetary theory
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

### [books.html](https://arjunvinod.com/books.html)
Reading list with:
- Dynamic book cover loading from Open Library API with ISBN fallbacks
- Theme-aware placeholder generation for missing covers
- Book descriptions and Amazon/ThriftBooks links
- Topics: Modern Monetary Theory, cryptocurrency, sound money, financial systems

## Design

The site uses a modern minimalist design language:

- **Color Palette**: Navy blue (#0f4c75) primary with teal (#14b8a6) accents
- **Typography**: System font stack with clean, readable hierarchy
- **Timeline**: Vertical timeline with gradient connecting lines and glowing dots
- **Cards**: Subtle shadows with hover animations and gradient accent bars
- **Accessibility**: High contrast colors in both light and dark modes

## Technical Features

- **No Build Process**: Pure HTML/CSS/JavaScript - no frameworks or bundlers required
- **Accessibility**: ARIA labels, skip links, semantic HTML, keyboard navigation
- **Performance**: Lazy loading, preconnect hints, optimized asset loading
- **SEO**: Meta tags, Open Graph, Twitter Cards, canonical URLs
- **PWA Ready**: Favicon set with multiple sizes for all platforms

## Structure

```
.
├── index.html              # Main page
├── books.html              # Reading list
├── css/
│   └── styles.css          # Shared styles and theme system
├── js/
│   ├── menu.js            # Mobile menu dropdown logic
│   └── theme.js           # Theme toggle and persistence
└── images/
    ├── favicon.ico
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    └── apple-touch-icon.png
```

## Local Development

Start a local web server:

```bash
python3 -m http.server 4000
```

Then visit [http://localhost:4000](http://localhost:4000)

## Technologies

- HTML5 with semantic markup
- CSS3 with custom properties (CSS variables) for theming
- Vanilla JavaScript (ES6+)
- Font Awesome 6.4.2 for icons
- Open Library Covers API for book images

## Theme System

The site implements a comprehensive theme toggle:
- Auto-detects system preference on first visit
- Persists user selection in `localStorage`
- Emits custom `themeChanged` event for reactive components
- CSS custom properties enable instant theme switching

## Contact

- **Email**: [me@arjunvinod.com](mailto:me@arjunvinod.com)
- **LinkedIn**: [linkedin.com/in/avinod](https://linkedin.com/in/avinod)
- **GitHub**: [github.com/arjun7965](https://github.com/arjun7965)
- **X (Twitter)**: [twitter.com/arjun7965](https://twitter.com/arjun7965)

## License

© 2026 Arjun Vinod. All rights reserved.
