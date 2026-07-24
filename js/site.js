// Shared page enhancements: copyright year and scroll-reveal animations

// Signals the inline <head> snippet that the scroll-reveal will run; without
// this flag the snippet un-hides all content after a timeout so a failed
// script load can't leave the page blank
window.siteJsLoaded = true;

window.addEventListener('DOMContentLoaded', () => {
    // Auto-update copyright year
    document.querySelectorAll('.copyright-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    const revealTargets = document.querySelectorAll('.expertise-card, .node, .book-item');
    const setRevealDelays = targets => {
        targets.forEach((el, index) => {
            const delay = Math.min(index, 3) * 70;
            el.style.setProperty('--reveal-delay', `${delay}ms`);
        });
    };

    // Stagger related items in a stable visual order. The cap keeps long
    // reading lists responsive instead of accumulating noticeable delays.
    setRevealDelays(document.querySelectorAll('.expertise-card'));
    document.querySelectorAll('.lane').forEach(lane => {
        setRevealDelays(lane.querySelectorAll('.node'));
    });
    document.querySelectorAll('.book-grid').forEach(grid => {
        setRevealDelays(grid.querySelectorAll('.book-item'));
    });

    // Keep content visible in browsers that do not support IntersectionObserver.
    if (typeof IntersectionObserver !== 'function') {
        revealTargets.forEach(el => {
            el.style.transition = 'none';
            el.classList.add('visible');
        });
        return;
    }

    // Scroll-reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealTargets.forEach(el => {
        // Elements already on screen are shown instantly: theme.js arms the
        // hidden state only after first paint, so animating these would make
        // a hard refresh flash content out and slowly fade it back in. Only
        // elements that scroll in later get the reveal animation.
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.style.transition = 'none';
            el.classList.add('visible');
        } else {
            revealObserver.observe(el);
        }
    });
});
