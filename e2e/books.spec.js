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

    await expect(page.getByRole('heading', { level: 1, name: 'Bookshelf' })).toBeVisible();
    await expect(page.locator('.site-nav a', { hasText: 'Books' })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('h2').first()).toHaveText('2026');
    await expect(page.locator('h2')).toHaveCount(2);
    await expect(page.locator('.reading-year')).toHaveCount(2);
    await expect(page.locator('.book-grid')).toHaveCount(2);
    expect(await page.locator('.book-item').count()).toBeGreaterThanOrEqual(11);
    await expect(page.locator('.book-title').first()).toContainText('Thinking in Bets');
    await expect(page.locator('.currently-reading-badge')).toHaveText('Currently Reading');
    await expect(page.locator('.book-item-featured')).toHaveCount(1);

    expect(errors).toEqual([]);
});

test('features the current book above a two-column desktop grid', async ({ page }) => {
    await page.goto('/books/');
    const firstYear = page.locator('.reading-year').first();
    const featuredBox = await firstYear.locator('.book-item-featured').boundingBox();
    const regularCards = firstYear.locator('.book-item:not(.book-item-featured)');
    const firstRegularBox = await regularCards.nth(0).boundingBox();
    const secondRegularBox = await regularCards.nth(1).boundingBox();

    expect(featuredBox.width).toBeGreaterThan(firstRegularBox.width * 1.8);
    expect(firstRegularBox.x).toBeLessThan(secondRegularBox.x);
    expect(Math.abs(firstRegularBox.y - secondRegularBox.y)).toBeLessThan(2);
});

test('book reveal delays stay restrained across long reading lists', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 450 });
    await page.goto('/books/');

    const delays = await page.locator('.book-grid').first().locator('.book-item').evaluateAll(cards =>
        cards.map(card => getComputedStyle(card).getPropertyValue('--reveal-delay').trim())
    );
    expect(delays).toEqual(['0ms', '70ms', '140ms', '210ms', '210ms']);
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
    await expect(firstCover).toHaveAttribute('loading', 'eager');
    await expect(firstCover).toHaveAttribute('fetchpriority', 'high');
    await expect(covers.nth(1)).toHaveAttribute('loading', 'lazy');
    await expect.poll(() => firstCover.evaluate(img => img.complete && img.naturalWidth > 1)).toBe(true);
});

test('book titles link to the same destinations as their covers', async ({ page }) => {
    await page.goto('/books/');
    const cards = page.locator('.book-item');

    for (let i = 0; i < await cards.count(); i++) {
        const card = cards.nth(i);
        await expect(card.locator('.book-title-link')).toHaveAttribute(
            'href',
            await card.locator('.book-cover a').getAttribute('href')
        );
    }
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
    expect(lightSvg).toContain('>Thinking in Bets<');
    expect(darkSvg).toContain('>Thinking in Bets<');
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

test.describe('mobile books layout', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('gives book notes the full card width', async ({ page }) => {
        await page.goto('/books/');
        const firstCard = page.locator('.book-item').first();
        const notes = firstCard.locator('.book-notes');
        const regularCards = page.locator('.book-item:not(.book-item-featured)');

        expect(await notes.evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(300);
        expect(await firstCard.locator('.book-cover').evaluate(el => el.getBoundingClientRect().width)).toBe(76);
        expect((await regularCards.nth(0).boundingBox()).x).toBe((await regularCards.nth(1).boundingBox()).x);
    });
});
