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

    const settleImmediately = elements => {
        if (elements.length === 0) return;
        elements.forEach(el => {
            el.style.transition = 'none';
            el.classList.add('visible', 'reveal-complete');
        });
        // Commit the instant reveal in one pass before restoring hover transitions.
        void document.documentElement.offsetHeight;
        elements.forEach(el => {
            el.style.removeProperty('transition');
        });
    };

    // Keep content visible in browsers that do not support IntersectionObserver.
    if (typeof IntersectionObserver !== 'function') {
        settleImmediately([...revealTargets]);
        return;
    }

    const finishReveal = el => {
        if (el.classList.contains('reveal-complete')) return;
        const delay = parseFloat(el.style.getPropertyValue('--reveal-delay')) || 0;
        const complete = () => el.classList.add('reveal-complete');
        el.addEventListener('transitionend', event => {
            if (event.target === el) complete();
        }, { once: true });
        setTimeout(complete, delay + 550);
    };

    // Scroll-reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                finishReveal(entry.target);
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const immediateTargets = [];
    revealTargets.forEach(el => {
        // Show elements already on screen instantly after the head bootstrap
        // hides them. Only later arrivals need the scroll-reveal animation.
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            immediateTargets.push(el);
        } else {
            revealObserver.observe(el);
        }
    });
    settleImmediately(immediateTargets);
});
