const { test, expect } = require('@playwright/test');
const { blockExternalRequests } = require('./utils');
const fs = require('fs');
const path = require('path');

const NOT_FOUND_HTML = fs.readFileSync(path.join(__dirname, '..', '404.html'), 'utf8');

test.beforeEach(async ({ page }) => {
    await blockExternalRequests(page);
    await page.route('**/layout-audit-missing', route =>
        route.fulfill({ status: 404, contentType: 'text/html', body: NOT_FOUND_HTML }));
});

test('all pages fit desktop and mobile viewports without horizontal scrolling', async ({ page }) => {
    for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 844 });

        for (const url of ['/', '/books/', '/layout-audit-missing']) {
            await page.goto(url);
            const dimensions = await page.evaluate(() => ({
                clientWidth: document.documentElement.clientWidth,
                scrollWidth: document.documentElement.scrollWidth,
            }));

            expect(dimensions.scrollWidth, `${url} overflowed at ${width}px`).toBe(dimensions.clientWidth);
        }
    }
});

test('mobile footer content is centered', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const styles = await page.locator('.footer-content').evaluate(el => {
        const computed = getComputedStyle(el);
        return {
            alignItems: computed.alignItems,
            flexDirection: computed.flexDirection,
            textAlign: computed.textAlign,
        };
    });

    expect(styles).toEqual({
        alignItems: 'center',
        flexDirection: 'column',
        textAlign: 'center',
    });
});

test('print styles reveal all content and remove site chrome', async ({ page }) => {
    await page.emulateMedia({ media: 'print' });

    await page.goto('/');
    expect(await page.locator('.node').last().evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    expect(await page.locator('body > header').evaluate(el => getComputedStyle(el).display)).toBe('none');
    expect(await page.locator('body > footer').evaluate(el => getComputedStyle(el).display)).toBe('none');

    await page.goto('/books/');
    expect(await page.locator('.book-item').last().evaluate(el => getComputedStyle(el).opacity)).toBe('1');
});
