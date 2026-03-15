# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local Development

```bash
python3 -m http.server 4000
```

Then visit http://localhost:4000. No build step, bundler, or package manager — the site is pure HTML/CSS/JS.

## Architecture

**Two pages, one shared stylesheet:**
- `index.html` — landing page with a two-lane vertical timeline (Experience / Education)
- `books.html` — reading list with book covers loaded from the Open Library Covers API
- `css/styles.css` — all shared styles; page-specific overrides live in inline `<style>` blocks at the top of each HTML file

**JavaScript files:**
- `js/theme.js` — sets `data-theme` attribute on `<html>` immediately on load (top-level, not deferred logic), then attaches the toggle button listener on `DOMContentLoaded`. Fires a custom `themeChanged` event that `books.html` listens to for regenerating placeholder covers.
- `js/menu.js` — dropdown toggle for the hamburger menu; handles outside-click, Escape, and iOS Safari quirks
- `js/books.js` — book cover loading for `books.html`. Tries ISBNs sequentially against `covers.openlibrary.org`, falling back to an SVG placeholder generated as a `data:` URI. Each `<img>` carries `data-isbn` and optionally `data-alt-isbns` (comma-separated) for fallback ordering.

## Theme System

Themes are toggled via a `data-theme="dark"` attribute on `<html>`. All colors are CSS custom properties defined in `:root` (light) and `[data-theme="dark"]` (dark) in `styles.css`. The user's choice is persisted in `localStorage` under the key `theme`.

