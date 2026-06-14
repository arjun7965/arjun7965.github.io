const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
    normalizeIsbn,
    isbn10to13,
    isbn13to10,
    unique,
    escapeHtml,
    buildIsbnCandidates,
    openLibraryUrlForIsbn,
    localCoverPath,
    readingListHtml,
    READING_LIST,
} = require('../js/books.js');

// Known-good ISBN-10/ISBN-13 pairs used throughout:
//   0306406152  ↔ 9780306406157  (canonical check-digit example)
//   0679720200  ↔ 9780679720201  (The Stranger — ISBN-10 check digit 0)
//   043942089X  ↔ 9780439420891  (ISBN-10 check digit X)

test('normalizeIsbn strips hyphens and spaces', () => {
    assert.equal(normalizeIsbn('978-0-306-40615-7'), '9780306406157');
    assert.equal(normalizeIsbn(' 0 306 40615 2 '), '0306406152');
});

test('normalizeIsbn uppercases the X check digit', () => {
    assert.equal(normalizeIsbn('043942089x'), '043942089X');
});

test('normalizeIsbn handles null, undefined, and numbers', () => {
    assert.equal(normalizeIsbn(null), '');
    assert.equal(normalizeIsbn(undefined), '');
    assert.equal(normalizeIsbn(9780306406157), '9780306406157');
});

test('isbn10to13 converts known pairs', () => {
    assert.equal(isbn10to13('0306406152'), '9780306406157');
    assert.equal(isbn10to13('0679720200'), '9780679720201');
    assert.equal(isbn10to13('043942089X'), '9780439420891');
});

test('isbn10to13 accepts hyphenated input', () => {
    assert.equal(isbn10to13('0-306-40615-2'), '9780306406157');
});

test('isbn10to13 rejects input that is not 10 digits', () => {
    assert.equal(isbn10to13('9780306406157'), null);
    assert.equal(isbn10to13('12345'), null);
    assert.equal(isbn10to13(''), null);
});

test('isbn13to10 converts known pairs', () => {
    assert.equal(isbn13to10('9780306406157'), '0306406152');
    assert.equal(isbn13to10('9780439420891'), '043942089X');
});

test('isbn13to10 produces check digit 0 when remainder is 11', () => {
    assert.equal(isbn13to10('9780679720201'), '0679720200');
});

test('isbn13to10 rejects 979-prefixed ISBNs (no ISBN-10 equivalent)', () => {
    assert.equal(isbn13to10('9798992242515'), null);
    assert.equal(isbn13to10('9791036219641'), null);
});

test('isbn13to10 rejects input that is not 13 digits', () => {
    assert.equal(isbn13to10('0306406152'), null);
    assert.equal(isbn13to10(''), null);
});

test('round trip 10 → 13 → 10 is identity', () => {
    for (const isbn10 of ['0306406152', '0679720200', '043942089X', '1999257405']) {
        assert.equal(isbn13to10(isbn10to13(isbn10)), isbn10);
    }
});

test('escapeHtml escapes markup-significant characters', () => {
    assert.equal(
        escapeHtml('Tom & Jerry\'s <"Adventures">'),
        'Tom &amp; Jerry&apos;s &lt;&quot;Adventures&quot;&gt;'
    );
});

test('escapeHtml passes plain text through and handles null/undefined', () => {
    assert.equal(escapeHtml('The Stranger'), 'The Stranger');
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
});

test('unique removes duplicates and falsy values, preserving order', () => {
    assert.deepEqual(unique(['a', 'b', 'a', null, '', 'c', 'b']), ['a', 'b', 'c']);
});

test('buildIsbnCandidates adds ISBN-13 conversion for an ISBN-10', () => {
    const img = { isbn: '0306406152' };
    assert.deepEqual(buildIsbnCandidates(img), ['0306406152', '9780306406157']);
});

test('buildIsbnCandidates adds ISBN-10 conversion for a 978 ISBN-13', () => {
    const img = { isbn: '9780306406157' };
    assert.deepEqual(buildIsbnCandidates(img), ['9780306406157', '0306406152']);
});

test('buildIsbnCandidates does not convert 979 ISBN-13s', () => {
    const img = { isbn: '9798992242515' };
    assert.deepEqual(buildIsbnCandidates(img), ['9798992242515']);
});

test('buildIsbnCandidates puts manual alt ISBNs first, in given order', () => {
    const img = {
        isbn: '9780306406157',
        altIsbns: '9780646824857, 9784477308265',
    };
    assert.deepEqual(buildIsbnCandidates(img), [
        '9780646824857',
        '9784477308265',
        '9780306406157',
        '0306406152',
    ]);
});

test('buildIsbnCandidates deduplicates overlapping manual and derived ISBNs', () => {
    const img = {
        isbn: '0306406152',
        altIsbns: '9780306406157,0306406152',
    };
    assert.deepEqual(buildIsbnCandidates(img), ['9780306406157', '0306406152']);
});

test('buildIsbnCandidates returns empty array when no ISBNs are present', () => {
    assert.deepEqual(buildIsbnCandidates({}), []);
});

test('openLibraryUrlForIsbn builds the large-cover URL with default=false', () => {
    assert.equal(
        openLibraryUrlForIsbn('9780306406157'),
        'https://covers.openlibrary.org/b/isbn/9780306406157-L.jpg?default=false'
    );
});

test('localCoverPath uses the normalized primary ISBN', () => {
    assert.equal(localCoverPath({ isbn: '978-0-306-40615-7' }), '/images/covers/9780306406157.jpg');
});

test('books/index.html contains the current pre-rendered reading list', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const html = fs.readFileSync(path.join(__dirname, '..', 'books', 'index.html'), 'utf8');
    assert.ok(
        html.includes(readingListHtml()),
        'books/index.html is stale — run: node scripts/render-books.js'
    );
});

test('every book in the reading list has a self-hosted cover image', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    for (const section of READING_LIST) {
        for (const book of section.books) {
            const file = path.join(__dirname, '..', localCoverPath(book));
            assert.ok(fs.existsSync(file), `missing cover for "${book.title}" — run: node scripts/fetch-covers.js`);
        }
    }
});

test('reading list records have required fields, valid ISBNs, and unique primary ISBNs', () => {
    const requiredFields = ['title', 'author', 'altText', 'link', 'isbn', 'notes'];
    const seenIsbns = new Set();

    function hasValidCheckDigit(isbn) {
        if (/^\d{13}$/.test(isbn)) {
            const sum = [...isbn].reduce((total, digit, index) =>
                total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
            return sum % 10 === 0;
        }
        if (/^\d{9}[\dX]$/.test(isbn)) {
            const sum = [...isbn].reduce((total, digit, index) =>
                total + (digit === 'X' ? 10 : Number(digit)) * (10 - index), 0);
            return sum % 11 === 0;
        }
        return false;
    }

    for (const section of READING_LIST) {
        assert.ok(Number.isInteger(section.year), 'section year must be an integer');
        assert.ok(section.description.trim(), `${section.year} is missing a description`);
        assert.ok(section.books.length > 0, `${section.year} must contain at least one book`);

        for (const book of section.books) {
            for (const field of requiredFields) {
                assert.equal(typeof book[field], 'string', `"${book.title || 'untitled'}" has a non-string ${field}`);
                assert.ok(book[field].trim(), `"${book.title || 'untitled'}" is missing ${field}`);
            }

            const isbn = normalizeIsbn(book.isbn);
            assert.ok(hasValidCheckDigit(isbn), `"${book.title}" has an invalid ISBN: ${book.isbn}`);
            assert.ok(!seenIsbns.has(isbn), `"${book.title}" duplicates primary ISBN ${isbn}`);
            seenIsbns.add(isbn);

            assert.doesNotThrow(() => new URL(book.link), `"${book.title}" has an invalid link`);
            assert.match(book.link, /^https:\/\//, `"${book.title}" link must use HTTPS`);
            if (book.currentlyReading !== undefined) {
                assert.equal(typeof book.currentlyReading, 'boolean');
            }
        }
    }
});

test('reading list sections are newest first and generated markup has one article per book', () => {
    const years = READING_LIST.map(section => section.year);
    const sortedYears = [...years].sort((a, b) => b - a);
    assert.deepEqual(years, sortedYears);
    assert.equal(new Set(years).size, years.length, 'section years must be unique');

    const bookCount = READING_LIST.reduce((total, section) => total + section.books.length, 0);
    const articleCount = (readingListHtml().match(/<article class="book-item">/g) || []).length;
    assert.equal(articleCount, bookCount);
});

test('self-hosted covers are non-trivial JPEG files', () => {
    const fs = require('node:fs');
    const path = require('node:path');

    for (const section of READING_LIST) {
        for (const book of section.books) {
            const file = path.join(__dirname, '..', localCoverPath(book));
            const cover = fs.readFileSync(file);
            assert.ok(cover.length >= 1024, `cover for "${book.title}" is suspiciously small`);
            assert.deepEqual([...cover.subarray(0, 2)], [0xff, 0xd8], `cover for "${book.title}" is not a JPEG`);
            assert.deepEqual([...cover.subarray(-2)], [0xff, 0xd9], `cover for "${book.title}" is truncated`);
        }
    }
});
