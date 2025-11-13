// Menu dropdown toggle
function toggleMenu() {
    const dropdown = document.querySelector('#menu-dropdown');
    const btn = document.querySelector('.menu-button');
    const willShow = !dropdown.classList.contains('show');
    dropdown.classList.toggle('show');
    if (btn) btn.setAttribute('aria-expanded', willShow ? 'true' : 'false');
}

// Close dropdown when clicking outside and on Escape key press, after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(event) {
        const menuWrapper = document.querySelector('.menu-wrapper');
        if (menuWrapper && !menuWrapper.contains(event.target)) {
            const dropdown = document.querySelector('#menu-dropdown');
            if (dropdown) {
                dropdown.classList.remove('show');
                const btn = document.querySelector('.menu-button');
                if (btn) btn.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Close dropdown on Escape key press
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' || event.key === 'Esc') {
            const dropdown = document.querySelector('#menu-dropdown');
            if (dropdown && dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                const btn = document.querySelector('.menu-button');
                if (btn) btn.setAttribute('aria-expanded', 'false');
            }
        }
    });
});

// Close dropdown when focus leaves the menu area
document.addEventListener('DOMContentLoaded', function() {
    const menuWrapper = document.querySelector('.menu-wrapper');
    if (menuWrapper) {
        menuWrapper.addEventListener('focusout', function(event) {
            // If the newly focused element is not inside the menu wrapper, close the dropdown
            if (!menuWrapper.contains(event.relatedTarget)) {
                const dropdown = document.querySelector('#menu-dropdown');
                if (dropdown && dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                    const btn = document.querySelector('.menu-button');
                    if (btn) btn.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }
});
