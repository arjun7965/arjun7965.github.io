const { test, expect } = require('@playwright/test');
const { blockExternalRequests, trackPageErrors } = require('./utils');

test.beforeEach(async ({ page }) => {
    await blockExternalRequests(page);
});

for (const { name, url, selector } of [
    { name: 'home', url: '/', selector: '.expertise-card, .node' },
    { name: 'books', url: '/books/', selector: '.book-item' },
]) {
    test(`${name} content stays visible when theme.js arrives after the reveal fallback`, async ({ page }) => {
        const errors = trackPageErrors(page);
        let releaseTheme;
        const themeGate = new Promise(resolve => { releaseTheme = resolve; });
        await page.route('**/js/theme.js', async route => {
            await themeGate;
            await route.continue();
        });
        await page.route('**/js/site.js', route => route.abort());

        try {
            // Hold the deferred theme script until the bootstrap reveals the page.
            await page.goto(url, { waitUntil: 'commit' });
            const targets = page.locator(selector);
            await expect(targets.first()).toBeAttached();
            await expect(page.locator('html')).toHaveClass(/\bjs\b/);
            const contentIsVisible = () => targets.evaluateAll(elements =>
                elements.every(element => getComputedStyle(element).opacity === '1')
            );
            await expect.poll(contentIsVisible, { timeout: 6000 }).toBe(true);

            releaseTheme();
            await page.waitForLoadState('load');
            await expect(page.locator('.theme-toggle')).toHaveAttribute('aria-label', 'Switch to dark mode');

            // Wait for any finite transitions so a fade back to zero cannot pass.
            await page.evaluate(async () => {
                const transitions = document.getAnimations().filter(animation =>
                    Number.isFinite(animation.effect.getComputedTiming().endTime)
                );
                await Promise.all(transitions.map(animation => animation.finished));
            });
            expect(await contentIsVisible()).toBe(true);
            expect(errors).toEqual([]);
        } finally {
            releaseTheme();
        }
    });
}

test.describe('unavailable theme storage', () => {
    test.use({ colorScheme: 'dark' });

    for (const mode of ['blocked access', 'failed writes']) {
        for (const { name, url } of [
            { name: 'home', url: '/' },
            { name: 'books', url: '/books/' },
            { name: '404', url: '/404.html' },
        ]) {
            test(`${name} theme stays synchronized with ${mode}`, async ({ page }) => {
                const errors = trackPageErrors(page);
                await page.addInitScript(storageMode => {
                    if (storageMode === 'blocked access') {
                        Object.defineProperty(window, 'localStorage', {
                            get() { throw new DOMException('Storage is blocked', 'SecurityError'); },
                        });
                    } else {
                        Storage.prototype.setItem = () => {
                            throw new DOMException('Storage is full', 'QuotaExceededError');
                        };
                    }
                    window.observedThemes = [];
                    document.addEventListener('themeChanged', event => {
                        window.observedThemes.push(event.detail.theme);
                    });
                }, mode);

                if (name === 'books') {
                    await page.route('**/images/covers/**', route => route.abort());
                }
                await page.goto(url);
                const html = page.locator('html');
                const toggle = page.locator('.theme-toggle');
                const icon = toggle.locator('svg path');
                const themeColor = page.locator('meta[name="theme-color"]');
                await expect(html).toHaveAttribute('data-theme', 'dark');
                await expect(toggle).toHaveAttribute('aria-checked', 'true');
                await expect(toggle).toHaveAttribute('aria-label', 'Switch to light mode');
                const darkIcon = await icon.getAttribute('d');
                const darkThemeColor = await themeColor.getAttribute('content');

                let darkCover;
                const cover = page.locator('.book-cover img').first();
                if (name === 'books') {
                    await expect(cover).toHaveAttribute('data-loaded', 'placeholder');
                    darkCover = await cover.getAttribute('src');
                }

                await toggle.click();
                await expect(html).toHaveAttribute('data-theme', 'light');
                await expect(toggle).toHaveAttribute('aria-checked', 'false');
                await expect(toggle).toHaveAttribute('aria-label', 'Switch to dark mode');
                await expect(icon).not.toHaveAttribute('d', darkIcon);
                await expect(themeColor).not.toHaveAttribute('content', darkThemeColor);
                if (darkCover) await expect(cover).not.toHaveAttribute('src', darkCover);

                await toggle.click();
                await expect(html).toHaveAttribute('data-theme', 'dark');
                await expect(toggle).toHaveAttribute('aria-checked', 'true');
                await expect(toggle).toHaveAttribute('aria-label', 'Switch to light mode');
                await expect(icon).toHaveAttribute('d', darkIcon);
                await expect(themeColor).toHaveAttribute('content', darkThemeColor);
                if (darkCover) await expect(cover).toHaveAttribute('src', darkCover);
                expect(await page.evaluate(() => window.observedThemes)).toEqual(['light', 'dark']);
                expect(errors).toEqual([]);
            });
        }
    }
});
