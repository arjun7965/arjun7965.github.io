const { test, expect } = require('@playwright/test');
const { blockExternalRequests, trackPageErrors } = require('./utils');

// Open Library is blocked in all of these tests (see utils.js), so every
// cover deterministically falls back to the generated SVG placeholder.
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

test('covers fall back to an SVG placeholder when Open Library is unreachable', async ({ page }) => {
    await page.goto('/books/');
    const firstCover = page.locator('.book-cover img').first();

    await expect(firstCover).toHaveAttribute('data-loaded', 'placeholder');
    await expect(firstCover).toHaveAttribute('src', /^data:image\/svg\+xml/);
});

test('covers below the fold load only when scrolled into view', async ({ page }) => {
    await page.goto('/books/');
    const lastCover = page.locator('.book-cover img').last();

    // Above-the-fold covers resolve; the last one must still be untouched
    await expect(page.locator('.book-cover img').first()).toHaveAttribute('data-loaded', 'placeholder');
    await expect(lastCover).not.toHaveAttribute('data-loaded', /./);
    await expect(lastCover).not.toHaveAttribute('src', /./);

    await lastCover.scrollIntoViewIfNeeded();
    await expect(lastCover).toHaveAttribute('data-loaded', 'placeholder');
});

test('placeholder covers regenerate when the theme changes', async ({ page }) => {
    await page.goto('/books/');
    const firstCover = page.locator('.book-cover img').first();
    await expect(firstCover).toHaveAttribute('data-loaded', 'placeholder');
    const lightSrc = await firstCover.getAttribute('src');

    await page.locator('.theme-toggle').click();

    await expect(firstCover).toHaveAttribute('src', /^data:image\/svg\+xml/);
    expect(await firstCover.getAttribute('src')).not.toBe(lightSrc);
});
