/* Global Utils */

const API_BASE = 'http://localhost/p2/skillsprint/backend/php';
const PYTHON_API_BASE = 'http://localhost:5000/api';

// User session management
let currentUser = null;

// Initialize user session
function initializeSession() {
    const savedUser = localStorage.getItem('skillsprint_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
}

// Save user session
function saveUserSession(user) {
    currentUser = user;
    localStorage.setItem('skillsprint_user', JSON.stringify(user));
}

// Clear session
function logout() {
    localStorage.removeItem('skillsprint_user');
    currentUser = null;
    navigateTo('index.html');
}

// Navigation
function navigateTo(page) {
    window.location.href = page;
}

// Show notification
function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<p>${message}</p>`;

    container.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, duration);
}

// Trigger confetti
function triggerConfetti(particleCount = 100) {
    if (typeof confetti === 'undefined') return;

    confetti({
        particleCount: particleCount,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#39FF14']
    });
}

// Format number with commas
function formatNumber(num) {
    return num.toLocaleString();
}

// Calculate time ago
function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
}

// Debounce function
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null;
}

// Get current user ID
function getCurrentUserId() {
    return currentUser ? currentUser.id : null;
}

// Animate counter
function animateCounter(element, start, end, duration = 1000) {
    const range = end - start;
    const increment = range / (duration / 50);
    let current = start;

    const counter = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = Math.round(end);
            clearInterval(counter);
        } else {
            element.textContent = Math.round(current);
        }
    }, 50);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeSession();

    // Check if user should be logged in
    const requiredAuthPages = ['dashboard.html', 'challenges.html', 'battle.html', 'quiz.html', 'leaderboard.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (requiredAuthPages.includes(currentPage) && !isLoggedIn()) {
        navigateTo('index.html');
    }
});

// Export functions for global use
window.initializeSession = initializeSession;
window.saveUserSession = saveUserSession;
window.logout = logout;
window.navigateTo = navigateTo;
window.showNotification = showNotification;
window.triggerConfetti = triggerConfetti;
window.formatNumber = formatNumber;
window.timeAgo = timeAgo;
window.isLoggedIn = isLoggedIn;
window.getCurrentUserId = getCurrentUserId;
window.animateCounter = animateCounter;

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeSession();
});
