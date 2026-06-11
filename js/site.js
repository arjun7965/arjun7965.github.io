// Shared page enhancements: copyright year and scroll-reveal animations

window.addEventListener('DOMContentLoaded', () => {
    // Auto-update copyright year
    document.querySelectorAll('.copyright-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    // Scroll-reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                entry.target.style.transitionDelay = `${i * 0.1}s`;
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.node, .book-item').forEach(el => {
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
