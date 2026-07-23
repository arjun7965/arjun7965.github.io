# Improvement Backlog

Remaining items from the June 2026 repo review (PRs #22–#40 are done: CI lint,
unit tests, polish bundle, Playwright e2e, ESLint, self-hosted covers,
pre-rendered books list, Lighthouse CI, theme.js split, 404 path fix,
Dependabot, actions/stylelint dep bumps, inline-style linting, axe-core
a11y checks, self-hosted fonts, scroll-reveal hard-refresh fix, pre-paint
arming via CSP-hashed inline snippet). Work each item as its own PR:
branch → `npm run lint` + `npm test` + `npm run test:e2e` → PR → merge on
green after authorization.

## 1. Deduplicate header/footer markup (DEFERRED)

Header/nav/footer/SVG markup is hand-duplicated across the three pages.
**Trigger to revisit: adding a third real content page.** Until then the
duplication costs less than the tooling.

- Approach when triggered: extend the `render-books.js` pattern into a
  `scripts/render-partials.js` that bakes shared partials between BEGIN/END
  markers, with a `--check` drift guard in CI
- JS injection is ruled out — it would break the no-JS support added in PR #27

## 2. Visual design refinements

- [x] Separate the hero, expertise, and timeline into alternating tinted
  section bands
- [ ] Add small self-hosted company and education marks to the timeline
- [ ] Feature the currently reading title and use a two-column desktop book
  grid
- [ ] Add a Selected Work section with two or three non-confidential
  engineering case studies
- [ ] Add restrained staggered motion while preserving reduced-motion support
