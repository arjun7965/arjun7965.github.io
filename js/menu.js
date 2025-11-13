// Menu dropdown toggle
function toggleMenu() {
    const dropdown = document.querySelector('#menu-dropdown');
    const btn = document.querySelector('.menu-button');
    const willShow = !dropdown.classList.contains('show');
    dropdown.classList.toggle('show');
    if (btn) btn.setAttribute('aria-expanded', willShow ? 'true' : 'false');
}

// Close dropdown when clicking outside, on Escape key press, and when focus leaves the menu area
document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const menuWrapper = document.querySelector('.menu-wrapper');
    const dropdown = document.querySelector('#menu-dropdown');
    const btn = document.querySelector('.menu-button');
    
    if (!menuWrapper || !dropdown || !btn) return;
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!menuWrapper.contains(event.target)) {
            dropdown.classList.remove('show');
            btn.setAttribute('aria-expanded', 'false');
        }
    });

    // Close dropdown on Escape key press
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' || event.key === 'Esc') {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                btn.setAttribute('aria-expanded', 'false');
                btn.focus(); // Return focus to button
            }
        }
    });
    
    // Close dropdown when focus leaves the menu area
    menuWrapper.addEventListener('focusout', function(event) {
        // If the newly focused element is not inside the menu wrapper, close the dropdown
        if (!event.relatedTarget || !menuWrapper.contains(event.relatedTarget)) {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                btn.setAttribute('aria-expanded', 'false');
            }
        }
    });
});
