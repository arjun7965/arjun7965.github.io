# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local Development

```bash
python3 -m http.server 4000
```

Then visit http://localhost:4000. No build step or bundler — the site is pure HTML/CSS/JS.

## Linting, Testing & Auditing

Run before pushing changes:

```bash
npm run lint          # HTMLHint + Stylelint (HTML & CSS)
npm run lint:html     # HTMLHint only
npm run lint:css      # Stylelint only
npm test              # node:test unit tests (test/) for the pure helpers in js/books.js
npm run test:e2e      # Playwright smoke tests (e2e/); starts its own server on port 4000
npm run lighthouse    # Lighthouse CI (requires local server on port 4000)
```

A Claude Code hook auto-lints HTML/CSS files on edit, but always run the full `npm run lint` before pushing. CI (`.github/workflows/ci.yml`) runs lint, unit tests, and e2e smoke tests on every PR and push to master.

The e2e tests block all non-localhost requests (Open Library, GoatCounter, fonts), so cover loading always falls back to SVG placeholders — they verify behavior, not Open Library availability.

## Architecture

**Two pages, one shared stylesheet:**
- `index.html` — landing page with a two-lane vertical timeline (Experience / Education)
- `books/index.html` — reading list (served at `/books/`) with book covers loaded from the Open Library Covers API
- `css/styles.css` — all shared styles; page-specific overrides live in inline `<style>` blocks at the top of each HTML file

**JavaScript files:**
- `js/theme.js` — sets `data-theme` attribute on `<html>` immediately on load (top-level, not deferred logic), then attaches the toggle button listener on `DOMContentLoaded`. Fires a custom `themeChanged` event that the books page listens to for regenerating placeholder covers.
- `js/menu.js` — dropdown toggle for the hamburger menu; handles outside-click, Escape, and iOS Safari quirks
- `js/books.js` — book cover loading for the books page. Tries ISBNs sequentially against `covers.openlibrary.org`, falling back to an SVG placeholder generated as a `data:` URI. Each `<img>` carries `data-isbn` and optionally `data-alt-isbns` (comma-separated) for fallback ordering.

## Workflow

- **Branching**: Create a new branch for larger or more complex changes; small/trivial fixes can go directly to master.
- **Commits**: Use conventional commits (`fix:`, `feat:`, `refactor:`, `style:`, `docs:`, `chore:`). Keep messages concise.
- **Always commit and push** when asked — do not just stage.

## Theme System

Themes are toggled via a `data-theme="dark"` attribute on `<html>`. All colors are CSS custom properties defined in `:root` (light) and `[data-theme="dark"]` (dark) in `styles.css`. The user's choice is persisted in `localStorage` under the key `theme`.

