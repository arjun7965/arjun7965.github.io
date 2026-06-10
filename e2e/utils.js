// Block every non-localhost request (Open Library covers, GoatCounter,
// Google Fonts) so smoke tests are hermetic and deterministic: cover loads
// always fail over to the SVG placeholder, and no analytics are sent.
async function blockExternalRequests(page) {
    await page.route(/^https?:\/\/(?!localhost)/, route => route.abort());
}

// Collect uncaught JS exceptions; resource-load failures (e.g. the blocked
// external requests above) do not count.
function trackPageErrors(page) {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    return errors;
}

module.exports = { blockExternalRequests, trackPageErrors };
