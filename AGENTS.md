# Repository Guidelines

## Project Structure & Module Organization

This is a static personal site with no bundler or build step. `index.html` is
the landing page with a two-lane Experience/Education timeline,
`books/index.html` is the pre-rendered reading list, and `404.html` is the
GitHub Pages fallback page. Shared styles live in
`css/styles.css`; page-specific CSS stays in small inline `<style>` blocks.
Browser scripts live in `js/`: `theme.js` sets `data-theme`, `site.js` handles
copyright and scroll reveal, and `books.js` is the `READING_LIST` source of
truth, runtime cover-fallback handler, and ISBN helper export for scripts/tests.
Covers are in `images/covers/` and named by primary ISBN; fonts are in `fonts/`.
Unit tests are in `test/`; Playwright smoke and accessibility tests are in
`e2e/`.

## Build, Test, and Development Commands

- `python3 -m http.server 4000`: serve the site locally at
  `http://localhost:4000`.
- `npm run lint`: run HTMLHint, Stylelint, and ESLint.
- `npm run lint:html`, `npm run lint:css`, `npm run lint:js`: run one linter.
- `npm test`: run Node unit tests for book helpers and site invariants.
- `npm run test:e2e`: run Playwright tests; it starts its own server.
- `npm run lighthouse`: run Lighthouse CI; start the local server first.
- `node scripts/fetch-covers.js`: download missing self-hosted book covers from
  Open Library.
- `node scripts/render-books.js`: regenerate `books/index.html` from
  `READING_LIST`.
- `node scripts/render-books.js --check`: verify `books/index.html` matches
  `READING_LIST`.

## Coding Style & Naming Conventions

Use plain HTML/CSS/JavaScript and follow existing formatting. JavaScript uses
CommonJS in tests/scripts and browser globals in `js/`. Keep comments short.
Do not hand-edit generated markup between the `BEGIN/END reading-list` comments
in `books/index.html`.

## Testing Guidelines

Run the narrowest relevant check while editing, then `npm run lint` before
pushing. CI runs lint, unit tests, Playwright, and Lighthouse on each PR and
push to `master`. E2E tests block external requests, so avoid runtime
third-party calls.

For book changes, add entries to `READING_LIST` in `js/books.js` with a required
`isbn` and optional comma-separated `altIsbns`. Run `node scripts/fetch-covers.js`,
`node scripts/render-books.js`, and `npm test`; commit covers and rendered HTML
together. Do not leave the rendered page stale after editing `READING_LIST`.

## Commit & Pull Request Guidelines

Create a branch for non-trivial work; small fixes may go directly to `master`.
Use conventional commits such as `fix:`, `feat:`, `docs:`, `test:`, and
`chore:`. When asked to commit and push, do both. For PRs, follow the project
style used in recent PRs: conventional title, `## Summary`, `## Testing`, and
ready-for-review unless a draft is intentional. Exclude unrelated files such as
`TODO.md`.

## Architecture Notes

Themes use `data-theme="dark"` on `<html>` and CSS custom properties in
`css/styles.css`; the user's choice is persisted in `localStorage` under the
`theme` key. `js/theme.js` sets the initial attribute immediately and fires a
`themeChanged` event after toggles so placeholder book covers can regenerate.
The inline head bootstrap must remain byte-identical across HTML pages and
authorized by each page's CSP hash. If it changes, update every copy and the
corresponding `script-src` hash.
