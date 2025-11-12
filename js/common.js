// Theme management
// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update icon
    const icon = document.querySelector('.theme-toggle-slider i');
    icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Set initial icon on page load
window.addEventListener('DOMContentLoaded', (event) => {
    const theme = document.documentElement.getAttribute('data-theme');
    const icon = document.querySelector('.theme-toggle-slider i');
    if (icon) icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
});

// Menu dropdown toggle
function toggleMenu() {
    const dropdown = document.querySelector('.menu-dropdown');
    const btn = document.querySelector('.menu-button');
    const willShow = !dropdown.classList.contains('show');
    dropdown.classList.toggle('show');
    if (btn) btn.setAttribute('aria-expanded', willShow ? 'true' : 'false');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const menuWrapper = document.querySelector('.menu-wrapper');
    if (menuWrapper && !menuWrapper.contains(event.target)) {
        const dropdown = document.querySelector('.menu-dropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
            const btn = document.querySelector('.menu-button');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        }
    }
});
