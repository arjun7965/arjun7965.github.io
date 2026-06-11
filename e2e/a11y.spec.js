const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');
const { blockExternalRequests } = require('./utils');
const fs = require('fs');
const path = require('path');

const NOT_FOUND_HTML = fs.readFileSync(path.join(__dirname, '..', '404.html'), 'utf8');

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const PAGES = [
    { name: 'landing page', goto: page => page.goto('/') },
    { name: 'books page', goto: page => page.goto('/books/') },
    {
        name: '404 page',
        // The local server has no catch-all 404 route (GitHub Pages does),
        // so simulate it the same way not-found.spec.js does.
        goto: async page => {
            await page.route('**/missing-page', route =>
                route.fulfill({ status: 404, contentType: 'text/html', body: NOT_FOUND_HTML }));
            await page.goto('/missing-page');
        },
    },
];

test.beforeEach(async ({ page }) => {
    await blockExternalRequests(page);
    // The stylesheet honors prefers-reduced-motion by collapsing transitions
    // to 0.01ms. Without this, axe can scan while the scroll-reveal fade-in
    // is mid-transition and measure blended (wrong) text colors — flaky on
    // slow CI runners.
    await page.emulateMedia({ reducedMotion: 'reduce' });
});

for (const theme of ['light', 'dark']) {
    test.describe(`${theme} theme`, () => {
        for (const { name, goto } of PAGES) {
            test(`${name} has no WCAG 2.1 A/AA violations`, async ({ page }) => {
                await page.addInitScript(t => localStorage.setItem('theme', t), theme);
                await goto(page);
                await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

                // The scroll-reveal observer keeps .node/.book-item elements at
                // opacity 0 until they enter the viewport, and axe skips
                // invisible elements — scroll to the bottom so everything is
                // revealed before scanning.
                await page.evaluate(async () => {
                    for (let y = 0; y <= document.body.scrollHeight; y += window.innerHeight) {
                        window.scrollTo(0, y);
                        await new Promise(r => setTimeout(r, 50));
                    }
                });

                const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
                expect(results.violations).toEqual([]);
            });
        }
    });
}
