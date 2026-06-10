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

    document.querySelectorAll('.node, .book-item').forEach(el => revealObserver.observe(el));
});
