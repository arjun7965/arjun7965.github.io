const { test, expect } = require('@playwright/test');
const { blockExternalRequests, trackPageErrors } = require('./utils');

// Covers are self-hosted under /images/covers/ (see scripts/fetch-covers.js);
// nothing external is needed, and external requests are blocked regardless.
test.beforeEach(async ({ page }) => {
    await blockExternalRequests(page);
});

test('books page renders all year sections and books without JS errors', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/books/');

    await expect(page.locator('h2').first()).toHaveText('2026');
    await expect(page.locator('h2')).toHaveCount(2);
    expect(await page.locator('.book-item').count()).toBeGreaterThanOrEqual(10);
    await expect(page.locator('.currently-reading-badge')).toHaveText('Currently Reading');

    expect(errors).toEqual([]);
});

test('covers are served self-hosted and actually load', async ({ page }) => {
    await page.goto('/books/');
    const covers = page.locator('.book-cover img');

    // Every cover points at a local file, none at Open Library
    const srcs = await covers.evaluateAll(imgs => imgs.map(i => i.getAttribute('src')));
    for (const src of srcs) {
        expect(src).toMatch(/^\/images\/covers\/[0-9X]+\.jpg$/);
    }

    // The first (above-the-fold) cover decodes to real pixels
    const firstCover = covers.first();
    await expect.poll(() => firstCover.evaluate(img => img.complete && img.naturalWidth > 1)).toBe(true);
});

test('a missing cover falls back to an SVG placeholder', async ({ page }) => {
    await page.route('**/images/covers/**', route => route.abort());
    await page.goto('/books/');
    const firstCover = page.locator('.book-cover img').first();

    await expect(firstCover).toHaveAttribute('data-loaded', 'placeholder');
    await expect(firstCover).toHaveAttribute('src', /^data:image\/svg\+xml/);
});

test('placeholder covers regenerate when the theme changes', async ({ page }) => {
    await page.route('**/images/covers/**', route => route.abort());
    await page.goto('/books/');
    const firstCover = page.locator('.book-cover img').first();
    await expect(firstCover).toHaveAttribute('data-loaded', 'placeholder');
    const lightSrc = await firstCover.getAttribute('src');

    await page.locator('.theme-toggle').click();

    await expect(firstCover).toHaveAttribute('src', /^data:image\/svg\+xml/);
    expect(await firstCover.getAttribute('src')).not.toBe(lightSrc);
});
