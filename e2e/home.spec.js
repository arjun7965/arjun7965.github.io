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
    await expect(page.locator('.hero-actions a')).toHaveCount(2);
    await expect(page.locator('.hero-actions a').first()).toHaveAttribute('href', 'mailto:arjun@arjunvinod.com');
    await expect(page.locator('.home-band')).toHaveCount(3);
    await expect(page.locator('.hero-visual')).toHaveCount(0);
    await expect(page.locator('.expertise-card')).toHaveCount(3);
    await expect(page.locator('.expertise-icon')).toHaveCount(3);
    await expect(page.locator('.lane-eyebrow')).toHaveText(['Career path', 'Academic background']);
    await expect(page.locator('.lane-experience .node')).toHaveCount(3);
    await expect(page.locator('.lane-education .node')).toHaveCount(2);
    await expect(page.locator('.node.is-current')).toHaveCount(1);
    await expect(page.locator('.lane-education .node.is-current')).toHaveCount(0);
    await expect(page.locator('.copyright-year')).toHaveText(String(new Date().getFullYear()));

    expect(errors).toEqual([]);
});

test('hero social logos keep their intended dimensions', async ({ page }) => {
    await page.goto('/');
    const linkDimensions = await page.locator('.hero-links a').evaluateAll(links =>
        links.map(link => {
            const { width, height } = link.getBoundingClientRect();
            return { width, height };
        })
    );
    const dimensions = await page.locator('.hero-links .icon').evaluateAll(icons =>
        icons.map(icon => {
            const { width, height } = icon.getBoundingClientRect();
            return { width, height };
        })
    );

    expect(linkDimensions).toHaveLength(3);
    for (const { width, height } of linkDimensions) {
        expect(width).toBe(44);
        expect(height).toBe(44);
    }
    expect(dimensions).toHaveLength(3);
    for (const { width, height } of dimensions) {
        expect(width).toBeGreaterThanOrEqual(19);
        expect(height).toBeGreaterThanOrEqual(19);
        expect(Math.abs(width - height)).toBeLessThan(1);
    }
});

test('timeline dates stack below roles on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const date = page.locator('.rm-meta').first();
    expect(await date.evaluate(element => getComputedStyle(element).display)).toBe('block');
    expect(await date.evaluate(element => getComputedStyle(element, '::before').content)).toBe('none');
});

test('theme toggle switches theme, persists it, and survives reload', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const toggle = page.locator('.theme-toggle');
    const themeColor = page.locator('meta[name="theme-color"]');

    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(themeColor).toHaveAttribute('content', '#fafbfc');

    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(themeColor).toHaveAttribute('content', '#0a0a0a');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(themeColor).toHaveAttribute('content', '#0a0a0a');

    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(themeColor).toHaveAttribute('content', '#fafbfc');
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

test('scroll reveal keeps content visible without IntersectionObserver', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.addInitScript(() => {
        window.IntersectionObserver = undefined;
    });

    await page.goto('/');

    const firstNode = page.locator('.node').first();
    await expect(firstNode).toBeVisible();
    expect(await firstNode.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    expect(errors).toEqual([]);
});

test('navigation marks the current page and links to books', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.site-nav a', { hasText: 'Home' })).toHaveAttribute('aria-current', 'page');
    await page.locator('.site-nav a', { hasText: 'Books' }).click();
    await expect(page).toHaveURL(/\/books\/$/);
    await expect(page).toHaveTitle(/Books/);
});

test('home page uses a sequential heading hierarchy', async ({ page }) => {
    await page.goto('/');
    const headingLevels = await page.locator('h1, h2, h3, h4').evaluateAll(headings =>
        headings.map(heading => Number(heading.tagName.slice(1)))
    );

    expect(headingLevels[0]).toBe(1);
    expect(headingLevels).not.toContain(4);
    for (let i = 1; i < headingLevels.length; i++) {
        expect(headingLevels[i] - headingLevels[i - 1]).toBeLessThanOrEqual(1);
    }
});

test('interactive elements have a custom keyboard focus indicator', async ({ page }) => {
    await page.goto('/');
    const primaryAction = page.locator('.button-primary');
    await primaryAction.focus();

    expect(await primaryAction.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
    expect(await primaryAction.evaluate(el => getComputedStyle(el).outlineWidth)).toBe('3px');
});

test.describe('mobile navigation', () => {
    test.use({ viewport: { width: 320, height: 720 } });

    test('keeps both destinations visible and navigable', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.site-nav a', { hasText: 'Home' })).toBeVisible();
        await expect(page.locator('.site-nav a', { hasText: 'Books' })).toBeVisible();
        await expect(page.locator('.theme-toggle')).toBeVisible();

        await page.locator('.site-nav a', { hasText: 'Books' }).click();
        await expect(page).toHaveURL(/\/books\/$/);
    });
});
