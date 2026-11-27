const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');
const { blockExternalRequests } = require('./utils');
const fs = require('fs');
const path = require('path');

const NOT_FOUND_HTML = fs.readFileSync(path.join(__dirname, '..', '404.html'), 'utf8');

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

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
            test(`${name} has no WCAG 2.2 A/AA violations`, async ({ page }) => {
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

        test('primary action retains accessible text contrast on hover', async ({ page }) => {
            await page.addInitScript(t => localStorage.setItem('theme', t), theme);
            await page.goto('/');
            const action = page.locator('.button-primary');
            await action.hover();
            expect(await action.evaluate(element => element.matches(':hover'))).toBe(true);

            const results = await new AxeBuilder({ page })
                .include('.button-primary')
                .withRules(['color-contrast'])
                .analyze();
            expect(results.incomplete).toEqual([]);
            expect(results.violations).toEqual([]);
        });

        test('timeline and social links retain WCAG AA contrast on hover', async ({ page }) => {
            await page.addInitScript(t => localStorage.setItem('theme', t), theme);
            await page.goto('/');

            for (const { selector, minRatio } of [
                { selector: '.rm-title a', minRatio: 4.5 },
                { selector: '.hero-links a', minRatio: 3.0 },
                { selector: '.footer-links a', minRatio: 3.0 },
            ]) {
                const target = page.locator(selector).first();
                await target.scrollIntoViewIfNeeded();
                await target.hover();
                const ratio = await target.evaluate(el => {
                    const parseRgba = value => {
                        const match = value.match(/rgba?\(([^)]+)\)/);
                        if (!match) return [0, 0, 0, 0];
                        const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
                        return [parts[0], parts[1], parts[2], parts[3] ?? 1];
                    };
                    const blend = (fg, bg) => {
                        const a = fg[3];
                        return [
                            fg[0] * a + bg[0] * (1 - a),
                            fg[1] * a + bg[1] * (1 - a),
                            fg[2] * a + bg[2] * (1 - a),
                            1,
                        ];
                    };
                    const luminance = rgb => {
                        const [r, g, b] = rgb.slice(0, 3).map(v => {
                            const c = v / 255;
                            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
                        });
                        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
                    };

                    const fg = parseRgba(getComputedStyle(el).color);
                    const layers = [];
                    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
                        const bg = parseRgba(getComputedStyle(node).backgroundColor);
                        if (bg[3] > 0) layers.push(bg);
                        if (bg[3] === 1) break;
                    }
                    const base = getComputedStyle(document.documentElement).colorScheme === 'dark'
                        ? [9, 17, 18, 1]
                        : [255, 255, 255, 1];
                    const effectiveBg = layers.reduceRight((acc, layer) => blend(layer, acc), base);
                    const effectiveFg = blend(fg, effectiveBg);
                    const l1 = luminance(effectiveFg);
                    const l2 = luminance(effectiveBg);
                    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
                });
                expect(ratio, `${selector} hover contrast in ${theme} theme`).toBeGreaterThanOrEqual(minRatio);
            }
        });
    });
}
