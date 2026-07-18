const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const HTML_FILES = ['index.html', 'books/index.html', '404.html'];

function read(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function inlineBootstrap(html) {
    const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
    const inline = scripts.filter(([, attributes]) => !/\bsrc\s*=/.test(attributes));
    assert.equal(inline.length, 1, 'expected exactly one inline script');
    return inline[0][2];
}

test('all pages share the same CSP-authorized inline bootstrap', () => {
    const pages = HTML_FILES.map(file => ({ file, html: read(file) }));
    const expectedScript = inlineBootstrap(pages[0].html);

    for (const { file, html } of pages) {
        const script = inlineBootstrap(html);
        assert.equal(script, expectedScript, `${file} inline bootstrap differs from index.html`);

        const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
        assert.ok(csp, `${file} is missing its Content-Security-Policy meta tag`);

        const hash = crypto.createHash('sha256').update(script).digest('base64');
        assert.ok(csp[1].includes(`'sha256-${hash}'`), `${file} CSP does not authorize its inline bootstrap`);
    }
});

test('404 page uses root-absolute URLs for local navigation and assets', () => {
    const html = read('404.html');
    const urls = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
    const localUrls = urls.filter(url =>
        !/^(?:https?:|mailto:|data:|#)/.test(url)
    );

    assert.ok(localUrls.length > 0);
    for (const url of localUrls) {
        assert.ok(url.startsWith('/'), `404.html local URL must be root-absolute: ${url}`);
    }
});

test('web manifest references existing icon files', () => {
    const manifest = JSON.parse(read('site.webmanifest'));
    assert.equal(manifest.id, '/');
    assert.equal(manifest.start_url, '/');
    assert.equal(manifest.scope, '/');
    assert.equal(manifest.lang, 'en');
    assert.ok(manifest.description.trim());
    assert.ok(manifest.categories.includes('portfolio'));
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);

    for (const icon of manifest.icons) {
        assert.ok(icon.src.startsWith('/'), `manifest icon must be root-absolute: ${icon.src}`);
        const file = path.join(ROOT, icon.src);
        assert.ok(fs.existsSync(file), `manifest icon does not exist: ${icon.src}`);
        assert.ok(fs.statSync(file).size > 0, `manifest icon is empty: ${icon.src}`);
    }
});

test('all pages provide theme-color metadata and persistent navigation', () => {
    for (const file of HTML_FILES) {
        const html = read(file);
        assert.match(html, /<meta name="theme-color" content="#fafbfc">/, `${file} is missing theme-color metadata`);
        assert.match(html, /<nav class="site-nav" aria-label="Primary navigation">/, `${file} is missing persistent navigation`);
        assert.doesNotMatch(html, /menu\.js|menu-button|menu-dropdown/, `${file} still contains mobile-menu code`);
    }
});

test('sitemap lists both canonical content pages with valid modification dates', () => {
    const sitemap = read('sitemap.xml');
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    const modified = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(match => match[1]);

    assert.deepEqual(locations, [
        'https://arjunvinod.com/',
        'https://arjunvinod.com/books/',
    ]);
    assert.equal(modified.length, locations.length);
    for (const date of modified) {
        assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
        assert.ok(!Number.isNaN(Date.parse(`${date}T00:00:00Z`)), `invalid sitemap date: ${date}`);
    }
});
