// Helper: Normalize ISBN (remove all non-digit characters except X)
function normalizeIsbn(isbn) {
    return (isbn || '').toString().replace(/[^0-9X]/gi, '').toUpperCase();
}

// Helper: Convert ISBN-10 to ISBN-13 (prefix 978)
// ISBN-13 is the modern standard that replaced ISBN-10. All ISBN-10s can be converted
// to ISBN-13 by prepending '978' (the Bookland EAN prefix) to the first 9 digits,
// then recalculating the check digit using the EAN-13 algorithm.
function isbn10to13(isbn10) {
    const clean = normalizeIsbn(isbn10);
    if (clean.length !== 10) return null;

    // Take first 9 digits of ISBN-10 and prepend '978' to create 12-digit base
    const core = '978' + clean.slice(0, 9);

    // Calculate EAN-13 check digit using the standard algorithm:
    // Sum all digits, alternating between weight 1 (even positions) and weight 3 (odd positions)
    // The check digit is the number needed to make the total sum a multiple of 10
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const d = parseInt(core[i], 10);
        sum += (i % 2 === 0) ? d : d * 3;  // Even index = weight 1, odd index = weight 3
    }
    const check = (10 - (sum % 10)) % 10;
    return core + String(check);
}

// Helper: Convert ISBN-13 to ISBN-10 (only for 978 prefix)
// Only ISBN-13s with '978' prefix (Bookland) can be converted back to ISBN-10.
// ISBN-13s with '979' prefix have no ISBN-10 equivalent as they were issued after
// the ISBN-10 system was deprecated.
function isbn13to10(isbn13) {
    const clean = normalizeIsbn(isbn13);
    if (clean.length !== 13 || !clean.startsWith('978')) return null;

    // Extract the 9 core digits (removing '978' prefix and check digit)
    const core9 = clean.slice(3, 12);

    // Calculate ISBN-10 check digit using modulo 11 algorithm:
    // Each digit is multiplied by its position weight (10 down to 2)
    // The check digit makes the weighted sum divisible by 11
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += (10 - i) * parseInt(core9[i], 10);  // Weights: 10, 9, 8, 7, 6, 5, 4, 3, 2
    }

    // Calculate what's needed to reach next multiple of 11
    let remainder = 11 - (sum % 11);
    let check;
    if (remainder === 10) check = 'X';        // 'X' represents 10 in ISBN-10
    else if (remainder === 11) check = '0';   // Remainder 11 means already divisible, use 0
    else check = String(remainder);
    return core9 + check;
}

function unique(arr) {
    return Array.from(new Set(arr.filter(Boolean)));
}

function buildIsbnCandidates(img) {
    const provided = normalizeIsbn(img.dataset.isbn || '');
    const manual = (img.dataset.altIsbns || '')
        .split(',')
        .map(s => normalizeIsbn(s))
        .filter(Boolean);

    const candidates = [];
    // Manual overrides first (explicit order)
    candidates.push(...manual);

    // Provided ISBN
    if (provided) candidates.push(provided);

    // Add conversions
    if (provided.length === 10) {
        candidates.push(isbn10to13(provided));
    } else if (provided.length === 13 && provided.startsWith('978')) {
        candidates.push(isbn13to10(provided));
    }

    return unique(candidates);
}

function openLibraryUrlForIsbn(isbn) {
    // default=false so a missing cover triggers error instead of generic placeholder
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
}

function generatePlaceholderDataURI(title, author) {
    const bg = document.documentElement.getAttribute('data-theme') === 'dark' ? '#2d2d2d' : '#e9eef3';
    const fg = document.documentElement.getAttribute('data-theme') === 'dark' ? '#d0d0d0' : '#2c3e50';
    const safeTitle = (title || 'No cover').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const safeAuthor = (author || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600">
            <rect width="100%" height="100%" fill="${bg}"/>
            <foreignObject x="20" y="40" width="360" height="520">
                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,Arial,sans-serif; color:${fg}; display:flex; flex-direction:column; justify-content:center; height:100%;">
                    <div style="font-size:28px; font-weight:700; line-height:1.2; margin-bottom:12px; word-wrap:break-word;">${safeTitle}</div>
                    <div style="font-size:18px; opacity:0.8;">${safeAuthor}</div>
                </div>
            </foreignObject>
        </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function tryLoadCover(img) {
    const title = img.getAttribute('alt') || img.dataset.title || '';
    const author = img.dataset.author || '';
    const isbns = buildIsbnCandidates(img);

    if (isbns.length === 0) {
        img.src = generatePlaceholderDataURI(title, author);
        img.dataset.loaded = 'placeholder';
        return;
    }

    const probes = [];

    function cleanup() {
        // Remove event handlers and references to avoid leaks
        probes.forEach(probe => {
            probe.onload = null;
            probe.onerror = null;
        });
        probes.length = 0;
    }

    // Try ISBNs sequentially to ensure deterministic order
    function tryNextIsbn(index) {
        if (index >= isbns.length) {
            // All ISBNs failed, use placeholder
            img.src = generatePlaceholderDataURI(title, author);
            img.dataset.loaded = 'placeholder';
            return;
        }
        const isbn = isbns[index];
        const testUrl = openLibraryUrlForIsbn(isbn);
        const probe = new Image();
        probes.push(probe);
        probe.onload = function() {
            // Check for 1x1 pixel placeholder images that some servers may return
            // Only reject images that are exactly 1x1 pixels (common placeholder)
            if (probe.naturalWidth === 1 && probe.naturalHeight === 1) {
                tryNextIsbn(index + 1);
                return;
            }
            img.src = testUrl;
            img.dataset.loaded = isbn;
            cleanup();
        };
        probe.onerror = function() {
            tryNextIsbn(index + 1);
        };
        probe.src = testUrl;
    }
    tryNextIsbn(0);
}

// Resolve book covers on page load
window.addEventListener('DOMContentLoaded', () => {
    // Resolve covers with fallbacks/alternates
    document.querySelectorAll('.book-cover img[data-isbn]').forEach(img => {
        tryLoadCover(img);
    });
});

// Listen for theme changes and regenerate placeholder images
document.addEventListener('themeChanged', () => {
    // Only regenerate placeholder images, not real book covers
    document.querySelectorAll('.book-cover img[data-loaded="placeholder"]').forEach(img => {
        const title = img.getAttribute('alt') || img.dataset.title || '';
        const author = img.dataset.author || '';
        img.src = generatePlaceholderDataURI(title, author);
    });
});
