const { test, expect } = require('@playwright/test');
const { blockExternalRequests, trackPageErrors } = require('./utils');
const fs = require('fs');
const path = require('path');

const NOT_FOUND_HTML = fs.readFileSync(path.join(__dirname, '..', '404.html'), 'utf8');

test.beforeEach(async ({ page }) => {
    await blockExternalRequests(page);
});

// GitHub Pages serves 404.html for ANY missing URL, including deeply nested
// ones, so every asset reference in it must be absolute. The local Python
// server doesn't do this, so simulate it by fulfilling a nested miss with
// the 404 page's contents.
test('404 page styles and scripts load from a nested URL', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.route('**/some/deep/missing/path', route =>
        route.fulfill({ status: 404, contentType: 'text/html', body: NOT_FOUND_HTML }));

    const failedAssets = [];
    page.on('response', res => {
        if (res.status() === 404 && !res.url().endsWith('/some/deep/missing/path')) {
            failedAssets.push(res.url());
        }
    });

    await page.goto('/some/deep/missing/path');

    await expect(page).toHaveTitle(/Page Not Found/);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.locator('.error-code')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');

    // styles.css resolved and applied (it sets the custom-property palette)
    expect(await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
    )).not.toBe('');

    // theme.js and site.js ran
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('.copyright-year')).toHaveText(String(new Date().getFullYear()));

    expect(failedAssets).toEqual([]);
    expect(errors).toEqual([]);
});
