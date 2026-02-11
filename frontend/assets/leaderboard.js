/* Leaderboard Page JavaScript */

let leaderboardMode = 'global';

async function initializeLeaderboard() {
    if (!isLoggedIn()) {
        navigateTo('index.html');
        return;
    }

    await loadLeaderboard();
    initializeAnimations();
}

async function loadLeaderboard() {
    let response;

    if (leaderboardMode === 'global') {
        response = await API.getGlobalLeaderboard(50);
    } else {
        response = await API.getWeeklyLeaderboard(50);
    }

    if (response.success) {
        displayLeaderboard(response.leaderboard);
        displayPodium(response.leaderboard.slice(0, 3));
    }

    // Load user rank
    const userId = getCurrentUserId();
    const rankResponse = await API.getUserRank(userId);
    if (rankResponse.success) {
        document.getElementById('userRank').textContent = rankResponse.rank;
    }
}

function displayPodium(topPlayers) {
    const container = document.getElementById('podiumContent');
    if (!container || topPlayers.length === 0) return;

    container.innerHTML = '';

    // Create podium items in order: 2nd, 1st, 3rd
    const order = [1, 0, 2];

    order.forEach((idx, displayIdx) => {
        if (topPlayers[idx]) {
            const player = topPlayers[idx];
            const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : 'rank-3';
            const rankNum = idx + 1;

            const item = document.createElement('div');
            item.className = `podium-item ${rankClass}`;

            item.innerHTML = `
                <div class="podium-position">
                    <div class="podium-rank">${rankNum === 1 ? '👑' : rankNum === 2 ? '🥈' : '🥉'}</div>
                    <img class="podium-avatar" src="${player.avatar_url}" alt="${player.username}">
                    <div class="podium-name">${player.username}</div>
                    <div class="podium-xp">${formatNumber(player.total_xp)} XP</div>
                </div>
            `;

            container.appendChild(item);

            // Animate entry
            gsap.from(item, {
                opacity: 0,
                y: 50,
                duration: 0.6,
                delay: displayIdx * 0.2,
                ease: 'back.out'
            });
        }
    });
}

function displayLeaderboard(leaderboard) {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    leaderboard.forEach((player, index) => {
        const row = document.createElement('tr');

        const isTopThree = index < 3;
        const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

        row.innerHTML = `
            <td>
                <div class="rank-badge ${isTopThree ? 'top-3' : ''}">
                    ${medalEmoji || (index + 1)}
                </div>
            </td>
            <td>
                <div class="player-cell">
                    <img class="player-cell-avatar" src="${player.avatar_url}" alt="${player.username}">
                    <div class="player-cell-name ${player.id === getCurrentUserId() ? 'highlight' : ''}">
                        ${player.username}
                        ${player.id === getCurrentUserId() ? ' (You)' : ''}
                    </div>
                </div>
            </td>
            <td>
                <div class="level-cell">
                    <span>Level ${player.level}</span>
                    <span class="level-dot"></span>
                </div>
            </td>
            <td>
                <div class="xp-cell">${formatNumber(player.total_xp)}</div>
            </td>
            <td>${player.total_challenges_completed}</td>
            <td>${player.total_battles_won}</td>
        `;

        tbody.appendChild(row);

        // Animate row
        gsap.from(row, {
            opacity: 0,
            x: -20,
            duration: 0.3,
            delay: index * 0.02,
            ease: 'power2.out'
        });

        // Highlight own row
        if (player.id === getCurrentUserId()) {
            row.style.background = 'rgba(139, 92, 246, 0.1)';
        }
    });
}

function switchLeaderboard(mode) {
    leaderboardMode = mode;

    // Update button states
    document.querySelectorAll('.header-controls .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Animate transition
    const table = document.querySelector('.leaderboard-table');
    gsap.to(table, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
            loadLeaderboard();
            gsap.to(table, {
                opacity: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeLeaderboard);
