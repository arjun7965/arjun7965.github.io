#!/usr/bin/env node
// Maintenance tool: download missing book covers from the Open Library
// Covers API into images/covers/, named by each book's primary ISBN.
// The site serves these self-hosted copies; this script is the only thing
// that talks to Open Library.
//
// Usage:
//   node scripts/fetch-covers.js           # fetch covers missing locally
//   node scripts/fetch-covers.js --force   # re-download all covers
//
// Exits non-zero if any book ends up without a cover (the site falls back
// to a generated SVG placeholder for those).

const fs = require('node:fs');
const path = require('node:path');
const {
    READING_LIST,
    normalizeIsbn,
    buildIsbnCandidates,
    openLibraryUrlForIsbn,
} = require('../js/books.js');

const OUT_DIR = path.join(__dirname, '..', 'images', 'covers');
const force = process.argv.includes('--force');

async function fetchCover(book) {
    const dest = path.join(OUT_DIR, `${normalizeIsbn(book.isbn)}.jpg`);
    if (!force && fs.existsSync(dest)) return 'already present';

    for (const isbn of buildIsbnCandidates(book)) {
        let res;
        try {
            res = await fetch(openLibraryUrlForIsbn(isbn));
        } catch {
            continue;
        }
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 1024) continue; // reject stub/1x1 responses
        fs.writeFileSync(dest, buf);
        return `downloaded via ${isbn} (${Math.round(buf.length / 1024)} KiB)`;
    }
    return 'NOT FOUND';
}

(async () => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    let missing = 0;
    for (const section of READING_LIST) {
        for (const book of section.books) {
            const status = await fetchCover(book);
            if (status === 'NOT FOUND') missing++;
            console.log(`${book.title.slice(0, 48).padEnd(50)} ${status}`);
        }
    }
    if (missing > 0) {
        console.error(`\n${missing} cover(s) missing — the site will show placeholders for them.`);
        process.exit(1);
    }
})();
