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
- [ ] Add small company and school logos to the timeline
  - Self-host SVG or PNG assets and place them in consistent 24–32px frames
  - Use restrained monochrome or muted treatments with suitable dark-mode
    contrast
  - Keep organization names as visible text and treat duplicate logos as
    decorative for assistive technology
  - Avoid oversized branded cards or inconsistent logo proportions
- [x] Feature the currently reading title and use a two-column desktop book
  grid
- [ ] Add a Selected Work section with two or three non-confidential
  engineering case studies
- [x] Add restrained staggered motion while preserving reduced-motion support
