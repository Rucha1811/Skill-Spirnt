/* Dashboard Page JavaScript */

let dashboardData = {};

async function initializeDashboard() {
    if (!isLoggedIn()) {
        navigateTo('index.html');
        return;
    }

    const userId = getCurrentUserId();

    // Load user profile
    const profileResponse = await API.getUserProfile(userId);
    if (profileResponse.success) {
        dashboardData.user = profileResponse.user;
        updateUserHeader(profileResponse.user);
    }

    // Load daily challenges
    const challengesResponse = await API.getDailyChallenges();
    if (challengesResponse.success) {
        displayDailyChallenges(challengesResponse.challenges);
    }

    // Load user stats
    const rank = await API.getUserRank(userId);
    if (rank.success) {
        document.getElementById('userRank').textContent = rank.rank || '--';
    }

    // Load completed challenges count
    const completedResponse = await API.getAllChallenges();
    if (completedResponse.success) {
        document.getElementById('totalCompleted').textContent = formatNumber(profileResponse.user.total_challenges_completed);
    }

    // Animate stats
    animateStats();
}

function updateUserHeader(user) {
    document.getElementById('userAvatar').src = user.avatar_url;
    document.getElementById('userName').textContent = user.username;
    document.getElementById('levelBadge').textContent = `Level ${user.level} 🏆`;
    document.getElementById('streakCount').textContent = user.streak_count;

    // Update XP bar
    const xpPercentage = (user.current_xp / user.xp_for_next_level) * 100;
    const xpFill = document.getElementById('xpBarFill');
    gsap.to(xpFill, {
        width: xpPercentage + '%',
        duration: 1,
        ease: 'power2.out'
    });
    document.getElementById('xpText').textContent = `${user.current_xp} / ${user.xp_for_next_level}`;

    // Update stats
    document.getElementById('challengesCompleted').textContent = user.total_challenges_completed;
    document.getElementById('battlesWon').textContent = user.total_battles_won;
}

function displayDailyChallenges(challenges) {
    const container = document.getElementById('dailyChallengesContainer');
    if (!container) return;

    container.innerHTML = '';

    challenges.forEach((challenge, index) => {
        const card = document.createElement('div');
        card.className = 'challenge-card';
        card.innerHTML = `
            <div class="challenge-header">
                <div class="challenge-icon">⚡</div>
                <div class="xp-reward">${challenge.xp_reward} XP</div>
            </div>
            <h3 class="challenge-title">${challenge.title}</h3>
            <div class="challenge-difficulty">${challenge.difficulty}</div>
            <p class="challenge-description" style="color: rgba(255,255,255,0.85); margin: 8px 0; font-size: 0.9rem;">${challenge.description || 'Solve this challenge'}</p>
            <div style="text-align: right; margin-top: 8px;">
                <span style="opacity: 0.7;">Daily Bonus: ${challenge.xp_multiplier || 1}x</span>
            </div>
        `;

        card.addEventListener('click', () => {
            navigateTo('challenges.html');
        });

        container.appendChild(card);

        // Stagger animation
        gsap.from(card, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            delay: index * 0.1,
            ease: 'back.out'
        });
    });
}

function animateStats() {
    const statItems = document.querySelectorAll('.stat-item .stat-value');
    statItems.forEach(item => {
        const finalValue = parseInt(item.textContent);
        if (!isNaN(finalValue)) {
            animateCounter(item, 0, finalValue, 800);
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeAnimations();
    initializeDashboard();

    // Refresh notifications every 30 seconds
    setInterval(async () => {
        if (isLoggedIn()) {
            const notifs = await API.getNotifications(getCurrentUserId(), 3);
            if (notifs.success && notifs.notifications.length > 0) {
                notifs.notifications.forEach(notif => {
                    if (!notif.is_read) {
                        showNotification(notif.message, 'success');
                    }
                });
            }
        }
    }, 30000);
});
