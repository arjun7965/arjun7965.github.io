// Theme toggle functionality shared across pages

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
    if (icon) icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    
    // Update aria-label for accessibility
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
        btn.setAttribute('aria-label', newTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }
    
    // Dispatch custom event for theme change
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
}

// Set initial icon and aria-label on page load
window.addEventListener('DOMContentLoaded', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const icon = document.querySelector('.theme-toggle-slider i');
    if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    } else {
        console.warn('Theme toggle icon element not found');
    }
    
    // Set initial aria-label and attach event listener
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
        btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
        btn.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
        btn.addEventListener('click', toggleTheme);
    }
});
