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
    icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Set initial icon on page load
window.addEventListener('DOMContentLoaded', (event) => {
    const theme = document.documentElement.getAttribute('data-theme');
    const icon = document.querySelector('.theme-toggle-slider i');
    if (icon) icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
});
