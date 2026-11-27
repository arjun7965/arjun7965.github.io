// Block every non-localhost request (e.g. GoatCounter analytics) so smoke
// tests remain hermetic and deterministic. Fonts, logos, and book covers are
// self-hosted, so they load normally from localhost.
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
