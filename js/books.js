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

const READING_LIST = [
    {
        year: 2026,
        description: "Starting fresh in 2026 with explorations into psychology, philosophy, and personal growth.",
        books: [
            {
                title: "The Stranger",
                author: "Albert Camus (translated by Matthew Ward)",
                shortTitle: "The Stranger",
                altText: "The Stranger by Albert Camus",
                link: "https://www.amazon.com/dp/0679720200",
                isbn: "9780679720201",
                notes: "Camus's iconic existentialist novel follows Meursault, an indifferent Algerian man whose emotional detachment leads to a fateful act of violence and a confrontation with mortality. A meditation on the absurd — the conflict between our desire for meaning and the universe's silence.",
                currentlyReading: true,
            },
            {
                title: "Mind to Matter: The Astonishing Science of How Your Brain Creates Material Reality",
                author: "Dawson Church",
                shortTitle: "Mind to Matter",
                authorAlt: "Dawson Church",
                altText: "Mind to Matter by Dawson Church",
                link: "https://www.thriftbooks.com/w/mind-to-matter-the-astonishing-science-of-how-your-brain-creates-material-reality_dawson-church/18645933/?resultid=2de6c45e-dd46-4b5c-92e6-cf8019dea194#edition=19846831&idiq=32358812",
                isbn: "9781788171151",
                notes: "An exploration of the mind-body connection, revealing scientific evidence for how consciousness and intention can influence physical reality, healing, and the material world around us.",
            },
            {
                title: "The Courage to Be Disliked",
                author: "Ichiro Kishimi and Fumitake Koga",
                altText: "The Courage to Be Disliked by Ichiro Kishimi and Fumitake Koga",
                link: "https://www.thriftbooks.com/w/the-courage-to-be-disliked_ichiro-kishimi_fumitake-koga/10893847/?resultid=d93bd8ae-8fc6-4db4-880f-134d5c931410#edition=73839563&idiq=85807882",
                isbn: "9781501197277",
                altIsbns: "9780646824857,9784477308265",
                notes: "A groundbreaking dialogue that reimagines Adlerian psychology through modern conversations, exploring how we can break free from past trauma, embrace our potential, and live authentically by having the courage to be disliked. Introduces Alfred Adler's revolutionary teleology approach—the idea that we are driven by future goals rather than past causes (etiology)—challenging the notion that our history determines our destiny.",
            },
        ],
    },
    {
        year: 2025,
        description: "In 2025, I became obsessed with one question: What is money? To find the answer, I read these six books, piecing together the history of our financial system. This journey transformed my understanding of what it means to operate in an economy built on fiat currency and geopolitical force, rather than the stability of sound money.",
        books: [
            {
                title: "Paper Soldiers: How the Weaponization of the Dollar Changed the World Order",
                author: "Saleha Mohsin",
                altText: "Paper Soldiers by Saleha Mohsin",
                link: "https://www.thriftbooks.com/w/paper-soldiers-how-the-weaponization-of-the-dollar-changed-the-world-order_saleha-mohsin/55037738/?resultid=b45c7b57-ac03-4945-9e3d-74a29ea8aab4#edition=67591091&idiq=57992781",
                isbn: "9780593539118",
                altIsbns: "9780593197543,059319754X",
                notes: "An inside look at how the U.S. dollar became a powerful geopolitical weapon through financial sanctions and economic warfare, reshaping global power dynamics and raising questions about the future of American financial dominance.",
            },
            {
                title: "The Case Against the Fed",
                author: "Murray N. Rothbard",
                altText: "The Case Against the Fed by Murray N. Rothbard",
                link: "https://www.thriftbooks.com/w/the-case-against-the-fed_murray-n-rothbard/343797/#edition=4404863&idiq=4178217",
                isbn: "9781987817720",
                notes: "A foundational critique of the Federal Reserve System, examining its origins, operations, and effects on the economy while arguing for a return to free-market banking and sound money backed by gold.",
            },
            {
                title: "The Big Print: What Happened to America and How Sound Money Will Fix It",
                author: "Lawrence Lepard",
                altText: "The Big Print by Lawrence Lepard",
                link: "https://www.amazon.com/dp/B0F2NCPQ2K",
                isbn: "9798992242515",
                notes: "A compelling analysis of how decades of monetary expansion and currency debasement have eroded American prosperity, and a call for returning to sound money principles to restore economic stability and opportunity.",
            },
            {
                title: "The Price of Tomorrow: Why Deflation Is the Key to an Abundant Future",
                author: "Jeff Booth",
                altText: "The Price of Tomorrow by Jeff Booth",
                link: "https://www.amazon.com/Price-Tomorrow-Deflation-Abundant-Future/dp/1999257405",
                isbn: "1999257405",
                notes: "A thought-provoking exploration of how exponential technological advancement is creating deflation in a world built on inflationary economic systems, and why embracing this shift could unlock unprecedented prosperity.",
            },
            {
                title: "Layered Money: From Gold and Dollars to Bitcoin and Central Bank Digital Currencies",
                author: "Nik Bhatia",
                altText: "Layered Money by Nik Bhatia",
                link: "https://www.amazon.com/Layered-Money-Dollars-Bitcoin-Currencies/dp/1736110527",
                isbn: "1736110527",
                notes: "An innovative framework for understanding money as a layered system, tracing its evolution from gold-backed currencies through modern banking to cryptocurrencies and the future of digital central bank money.",
            },
            {
                title: "The Deficit Myth: Modern Monetary Theory and the Birth of the People's Economy",
                author: "Stephanie Kelton",
                altText: "The Deficit Myth by Stephanie Kelton",
                link: "https://www.amazon.com/Deficit-Myth-Monetary-Peoples-Economy/dp/1541736184",
                isbn: "1541736184",
                notes: "A leading economist challenges conventional deficit thinking and explains how Modern Monetary Theory reveals the true power and limitations of sovereign currencies in advancing the public good.",
            },
        ],
    },
];

function renderReadingList(container) {
    const shortTitleOf = book => book.shortTitle || book.title.split(':')[0].trim();
    const html = READING_LIST.map(section => {
        const books = section.books.map(book => {
            const altIsbns = book.altIsbns ? ` data-alt-isbns="${book.altIsbns}"` : '';
            const badge = book.currentlyReading
                ? '<span class="currently-reading-badge">Currently Reading</span>'
                : '';
            return `
            <article class="book-item">
                <div class="book-cover">
                    <a href="${book.link}" target="_blank" rel="noopener noreferrer">
                        <img loading="lazy" decoding="async" data-isbn="${book.isbn}"${altIsbns} alt="${book.altText}" data-title="${shortTitleOf(book)}" data-author="${book.author}">
                    </a>
                </div>
                <div class="book-details">
                    <h3 class="book-title">${book.title}${badge}</h3>
                    <div class="book-author">by ${book.author}</div>
                    <p class="book-notes">${book.notes}</p>
                </div>
            </article>`;
        }).join('');
        return `
            <h2>${section.year}</h2>
            <p class="section-description">${section.description}</p>
            ${books}`;
    }).join('');
    container.insertAdjacentHTML('beforeend', html);
}

// Render immediately so theme.js's DOMContentLoaded observer sees the items.
// Safe under `defer`: the DOM is parsed before this script executes.
const readingListContainer = document.querySelector('[data-reading-list]');
if (readingListContainer) renderReadingList(readingListContainer);

// Resolve book covers on page load
window.addEventListener('DOMContentLoaded', () => {
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
