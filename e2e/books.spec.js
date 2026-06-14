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

// The reading list is pre-rendered static HTML and the scroll-reveal's
// hidden state is scoped to html.js, so the page works without JavaScript
test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('reading list is fully visible', async ({ page }) => {
        await page.goto('/books/');
        expect(await page.locator('.book-item').count()).toBeGreaterThanOrEqual(10);
        const firstBook = page.locator('.book-item').first();
        await expect(firstBook).toBeVisible();
        expect(await firstBook.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    });
});

test('placeholder covers regenerate when the theme changes', async ({ page }) => {
    await page.route('**/images/covers/**', route => route.abort());
    await page.goto('/books/');
    const firstCover = page.locator('.book-cover img').first();
    await expect(firstCover).toHaveAttribute('data-loaded', 'placeholder');
    const lightSrc = await firstCover.getAttribute('src');
    const lightSvg = decodeURIComponent(lightSrc.split(',')[1]);

    await page.locator('.theme-toggle').click();

    await expect(firstCover).toHaveAttribute('src', /^data:image\/svg\+xml/);
    const darkSrc = await firstCover.getAttribute('src');
    const darkSvg = decodeURIComponent(darkSrc.split(',')[1]);

    expect(darkSrc).not.toBe(lightSrc);
    expect(lightSvg).toContain('>My Stroke of Insight<');
    expect(darkSvg).toContain('>My Stroke of Insight<');
    expect(lightSvg).toContain('fill="#e9eef3"');
    expect(darkSvg).toContain('fill="#2d2d2d"');
});

test('theme changes do not replace successfully loaded covers', async ({ page }) => {
    await page.goto('/books/');
    const firstCover = page.locator('.book-cover img').first();
    const originalSrc = await firstCover.getAttribute('src');

    await expect.poll(() => firstCover.evaluate(img => img.complete && img.naturalWidth > 1)).toBe(true);
    await page.locator('.theme-toggle').click();

    await expect(firstCover).toHaveAttribute('src', originalSrc);
    await expect(firstCover).not.toHaveAttribute('data-loaded', 'placeholder');
});
