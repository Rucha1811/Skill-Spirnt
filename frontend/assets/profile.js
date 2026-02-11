/* Profile Page JavaScript */

async function initializeProfile() {
    if (!isLoggedIn()) {
        navigateTo('index.html');
        return;
    }

    const userId = getCurrentUserId();

    // Load user profile
    const profileResponse = await API.getUserProfile(userId);
    if (profileResponse.success) {
        displayProfile(profileResponse.user);
    }

    // Load badges
    const badgesResponse = await API.getUserBadges(userId);
    if (badgesResponse.success) {
        displayBadges(badgesResponse.badges);
    }

    // Load streak calendar
    displayStreakCalendar();

    initializeAnimations();
}

function displayProfile(user) {
    document.getElementById('profileAvatar').src = user.avatar_url;
    document.getElementById('profileName').textContent = user.username;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileLevel').textContent = user.level;

    // Update level circle glow
    const levelCircle = document.getElementById('levelCircle');
    if (user.level >= 10) {
        levelCircle.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
    } else if (user.level >= 5) {
        levelCircle.style.background = 'linear-gradient(135deg, #8B5CF6, #3B82F6)';
    }

    // Update XP bar
    const xpPercentage = (user.current_xp / user.xp_for_next_level) * 100;
    const xpFill = document.getElementById('profileXpBar');
    gsap.to(xpFill, {
        width: xpPercentage + '%',
        duration: 1.5,
        ease: 'power2.out'
    });

    document.getElementById('profileXpText').textContent = `${user.current_xp} / ${user.xp_for_next_level} XP`;

    // Update stats
    document.getElementById('totalChallenges').textContent = user.total_challenges_completed;
    document.getElementById('totalBattles').textContent = user.total_battles_won;
    document.getElementById('currentStreak').textContent = user.streak_count;
    document.getElementById('bestStreak').textContent = user.longest_streak;

    // Animate stats
    animateProfileStats();
}

function displayBadges(badges) {
    const container = document.getElementById('badgesContainer');
    if (!container) return;

    container.innerHTML = '';

    badges.forEach((badge, index) => {
        const badgeItem = document.createElement('div');
        badgeItem.className = `badge-item ${badge.unlocked_at ? '' : 'locked'}`;

        if (badge.unlocked_at) {
            badgeItem.classList.add('new');
        }

        badgeItem.innerHTML = `
            <div class="badge-icon">${badge.icon_url}</div>
            <div class="badge-name">${badge.name}</div>
            ${badge.unlocked_at ? `<div class="badge-unlocked-date">${timeAgo(badge.unlocked_at)}</div>` : ''}
        `;

        badgeItem.addEventListener('click', () => {
            if (badge.unlocked_at) {
                showNotification(`${badge.name}: ${badge.description}`, 'info');
            } else {
                showNotification(`Locked: ${badge.description}`, 'warning');
            }
        });

        container.appendChild(badgeItem);

        // Animate entry
        gsap.from(badgeItem, {
            opacity: 0,
            scale: 0.5,
            duration: 0.4,
            delay: index * 0.05,
            ease: 'back.out'
        });
    });
}

function displayStreakCalendar() {
    const container = document.getElementById('streakCalendar').querySelector('.calendar-grid');
    if (!container) return;

    container.innerHTML = '';

    // Create calendar for current month
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(today.getFullYear(), today.getMonth(), day);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = date.toDateString() === today.toDateString();

        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        let dayClass = '';
        let emoji = '❌';

        // Simple logic - in production, fetch from API
        if (isToday) {
            dayClass = 'today';
            emoji = '🔥';
            dayElement.classList.add('completed');
        } else if (Math.random() > 0.3) {
            dayClass = 'completed';
            emoji = '🔥';
            dayElement.classList.add('completed');
        } else {
            dayClass = 'missed';
            emoji = '🔥';
            dayElement.classList.add('missed');
        }

        dayElement.textContent = emoji;
        dayElement.title = `Day ${day}`;

        container.appendChild(dayElement);

        // Animate entry
        gsap.from(dayElement, {
            opacity: 0,
            scale: 0.5,
            duration: 0.3,
            delay: (day - 1) * 0.01,
            ease: 'back.out'
        });
    }
}

function animateProfileStats() {
    const statValues = document.querySelectorAll('.profile-stats .stat-value');
    statValues.forEach(stat => {
        const finalValue = parseInt(stat.textContent);
        if (!isNaN(finalValue)) {
            animateCounter(stat, 0, finalValue, 1000);
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeProfile);
