const { test, expect } = require('@playwright/test');
const { blockExternalRequests, trackPageErrors } = require('./utils');

test.beforeEach(async ({ page }) => {
    await blockExternalRequests(page);
});

test('landing page renders hero and timeline without JS errors', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('/');

    await expect(page).toHaveTitle(/Arjun Vinod/);
    await expect(page.locator('.hero-name')).toHaveText('Arjun Vinod');
    await expect(page.locator('.lane-experience .node')).toHaveCount(3);
    await expect(page.locator('.lane-education .node')).toHaveCount(2);
    await expect(page.locator('.copyright-year')).toHaveText(String(new Date().getFullYear()));

    expect(errors).toEqual([]);
});

test('theme toggle switches theme, persists it, and survives reload', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const toggle = page.locator('.theme-toggle');

    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
});

test.describe('system theme preference', () => {
    test.use({ colorScheme: 'dark' });

    test('defaults to dark when no preference is stored', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await expect(page.locator('.theme-toggle')).toHaveAttribute('aria-checked', 'true');
        await expect(page.locator('.theme-toggle')).toHaveAttribute('aria-label', 'Switch to light mode');
    });
});

test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('timeline content is fully visible', async ({ page }) => {
        await page.goto('/');
        const firstNode = page.locator('.node').first();
        await expect(firstNode).toBeVisible();
        expect(await firstNode.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    });
});

// The inline <head> snippet arms the scroll-reveal pre-paint; its CSP
// sha256 hash silently stops matching if the snippet is edited (theme.js
// would mask that as the old flash behavior), so assert it really ran
test('inline head snippet passes CSP and un-hides content if site.js never loads', async ({ page }) => {
    const cspErrors = [];
    page.on('console', msg => {
        if (msg.text().includes('Content Security Policy')) cspErrors.push(msg.text());
    });

    // With every external script blocked, only the inline snippet can add .js
    await page.route('**/js/*.js', route => route.abort());
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/js/);
    expect(cspErrors).toEqual([]);

    // site.js never set its flag, so the snippet's timeout must un-hide
    // the content instead of leaving the page blank
    await expect(page.locator('html')).not.toHaveClass(/js/, { timeout: 5000 });
    const firstNode = page.locator('.node').first();
    expect(await firstNode.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
});

test('desktop nav links to the books page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.menu-button')).toBeHidden();
    await page.locator('#menu-dropdown a', { hasText: 'Books' }).click();
    await expect(page).toHaveURL(/\/books\/$/);
    await expect(page).toHaveTitle(/Books/);
});

// The hamburger menu only exists at mobile widths (<= 480px)
test.describe('mobile menu', () => {
    test.use({ viewport: { width: 400, height: 800 } });

    test('opens, moves focus to first link, and closes on Escape', async ({ page }) => {
        await page.goto('/');
        const button = page.locator('.menu-button');
        const dropdown = page.locator('#menu-dropdown');

        await button.click();
        await expect(dropdown).toHaveClass(/show/);
        await expect(button).toHaveAttribute('aria-expanded', 'true');
        await expect(dropdown.locator('a').first()).toBeFocused();

        await page.keyboard.press('Escape');
        await expect(dropdown).not.toHaveClass(/show/);
        await expect(button).toHaveAttribute('aria-expanded', 'false');
        await expect(button).toBeFocused();
    });

    test('closes when clicking outside', async ({ page }) => {
        await page.goto('/');
        const button = page.locator('.menu-button');
        const dropdown = page.locator('#menu-dropdown');

        await button.click();
        await expect(dropdown).toHaveClass(/show/);

        // Raw click on empty space left of the dropdown (the dropdown
        // overlays centered content at mobile width)
        await page.mouse.click(10, 400);
        await expect(dropdown).not.toHaveClass(/show/);
        await expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    test('navigates to the books page', async ({ page }) => {
        await page.goto('/');
        await page.locator('.menu-button').click();
        await page.locator('#menu-dropdown a', { hasText: 'Books' }).click();
        await expect(page).toHaveURL(/\/books\/$/);
        await expect(page).toHaveTitle(/Books/);
    });
});
