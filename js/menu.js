// Menu dropdown toggle
function toggleMenu() {
    const dropdown = document.querySelector('#menu-dropdown');
    const btn = document.querySelector('.menu-button');
    const willShow = !dropdown.classList.contains('show');
    dropdown.classList.toggle('show');
    if (btn) btn.setAttribute('aria-expanded', willShow ? 'true' : 'false');
}

// Close dropdown when clicking outside
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
