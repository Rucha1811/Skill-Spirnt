/* Battle Arena JavaScript */

let battleState = {
    battleId: null,
    playerId: null,
    opponent: null,
    status: 'lobby',
    timeStarted: null,
    challenge: null
};

async function initializeBattle() {
    if (!isLoggedIn()) {
        navigateTo('index.html');
        return;
    }

    battleState.playerId = getCurrentUserId();
    loadAvailableBattles();
    initializeAnimations();
}

async function loadAvailableBattles() {
    const response = await API.getAvailableBattles();
    if (response.success && response.battles.length > 0) {
        displayAvailableBattles(response.battles);
    } else {
        document.querySelector('.available-battles h3').textContent = 'No active battles. Create one to get started!';
    }
}

function displayAvailableBattles(battles) {
    const container = document.getElementById('availableBattles');
    container.innerHTML = '';

    battles.forEach((battle, index) => {
        const item = document.createElement('div');
        item.className = 'battle-item';

        item.innerHTML = `
            <div class="battle-opponent">
                <img class="opponent-avatar" src="${battle.avatar_url}" alt="${battle.username}">
                <div class="opponent-info">
                    <h4>${battle.username}</h4>
                    <div class="opponent-level">Level ${battle.level}</div>
                </div>
            </div>
            <div style="margin-bottom: 8px;">
                <div class="battle-difficulty">${battle.difficulty}</div>
                <p style="font-size: 0.9rem; margin-top: 4px; opacity: 0.8;">${battle.title}</p>
            </div>
        `;

        item.addEventListener('click', () => joinBattle(battle.id));

        container.appendChild(item);

        gsap.from(item, {
            opacity: 0,
            y: 20,
            duration: 0.3,
            delay: index * 0.05,
            ease: 'back.out'
        });
    });
}

async function createBattle() {
    if (!isLoggedIn()) return;

    const difficulty = document.getElementById('difficultySelect').value;

    // Get a random challenge based on difficulty
    const challengesResponse = await API.getAllChallenges();
    if (!challengesResponse.success) {
        showNotification('Error loading challenges', 'error');
        return;
    }

    let challenges = challengesResponse.challenges;
    if (difficulty) {
        challenges = challenges.filter(c => c.difficulty === difficulty);
    }

    if (challenges.length === 0) {
        showNotification('No challenges available for this difficulty', 'warning');
        return;
    }

    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    battleState.challenge = randomChallenge;

    const response = await API.createBattle(battleState.playerId, randomChallenge.id);
    if (response.success) {
        battleState.battleId = response.battle_id;
        battleState.status = 'waiting';

        showNotification('Battle created! Waiting for opponent...', 'success');

        // Switch to battle screen
        document.getElementById('battleLobby').style.display = 'none';
        document.getElementById('battleInProgress').style.display = 'flex';

        // Simulate countdown and opponent join
        simulateBattleStart();
    } else {
        showNotification(response.message || 'Error creating battle', 'error');
    }
}

async function joinBattle(battleId) {
    const response = await API.joinBattle(battleId, battleState.playerId);
    if (response.success) {
        battleState.battleId = battleId;
        battleState.status = 'joined';

        showNotification('Joined battle!', 'success');

        document.getElementById('battleLobby').style.display = 'none';
        document.getElementById('battleInProgress').style.display = 'flex';

        simulateBattleStart();
    } else {
        showNotification(response.message || 'Error joining battle', 'error');
    }
}

function simulateBattleStart() {
    // Show countdown
    const countdown = document.getElementById('countdown');
    countdown.style.display = 'block';

    let count = 3;
    const countInterval = setInterval(() => {
        document.getElementById('countdownNumber').textContent = count;

        gsap.from(document.getElementById('countdownNumber'), {
            scale: 2,
            opacity: 0,
            duration: 1
        });

        count--;
        if (count < 0) {
            clearInterval(countInterval);
            countdown.style.display = 'none';
            startBattle();
        }
    }, 1000);

    // Load opponent info (simulated)
    document.getElementById('player2Name').textContent = 'Opponent';
    document.getElementById('player2Avatar').src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=opponent';
    document.getElementById('player2Level').textContent = 'Level 5';

    // Load challenge info
    if (battleState.challenge) {
        document.querySelector('.code-editor-section h3').textContent = `Challenge: ${battleState.challenge.title}`;
    }
}

function startBattle() {
    battleState.status = 'in_progress';
    battleState.timeStarted = Date.now();

    // Start battle timer
    let timeLeft = 60;
    const timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timerText').textContent = timeLeft + 's';

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleBattleTimeout();
        }
    }, 1000);

    showNotification('Battle started! Code quickly!', 'success');
}

async function submitBattleSolution() {
    const timeTaken = Math.floor((Date.now() - battleState.timeStarted) / 1000);

    const response = await API.submitBattleSolution(
        battleState.battleId,
        battleState.playerId,
        timeTaken
    );

    if (response.success) {
        if (response.winner_id) {
            // Battle complete
            showBattleResult(response.winner_id === battleState.playerId);
        } else {
            showNotification('Solution submitted! Waiting for opponent...', 'info');
            document.querySelector('.battle-actions').disabled = true;
        }
    }
}

function showBattleResult(won) {
    document.getElementById('battleInProgress').style.display = 'none';
    document.getElementById('battleResult').style.display = 'flex';

    const content = document.getElementById('resultContent');
    if (won) {
        content.innerHTML = `
            <h2 style="color: var(--primary-green); font-size: 3rem; margin-bottom: 20px;">🎉 VICTORY!</h2>
            <p style="font-size: 1.2rem; margin-bottom: 20px;">You won the battle!</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div>
                    <div style="font-size: 2rem; font-weight: 700; color: var(--primary-green);">+150 XP</div>
                    <p style="color: var(--text-muted);">Experience</p>
                </div>
                <div>
                    <div style="font-size: 2rem; font-weight: 700; color: var(--primary-purple);">1</div>
                    <p style="color: var(--text-muted);">Battle Won</p>
                </div>
            </div>
        `;
        triggerConfetti(200);
        createSuccessParticles(content);
    } else {
        content.innerHTML = `
            <h2 style="color: var(--primary-pink); font-size: 3rem; margin-bottom: 20px;">Defeated</h2>
            <p style="font-size: 1.2rem; margin-bottom: 20px;">Keep practicing!</p>
            <div style="font-size: 1.2rem; color: var(--text-muted);">Better luck next time</div>
        `;
        shakeScreen(500);
    }
}

function handleBattleTimeout() {
    showNotification('Time\'s up!', 'warning');
    submitBattleSolution();
}

function leaveBattle() {
    document.getElementById('battleInProgress').style.display = 'none';
    document.getElementById('battleLobby').style.display = 'flex';
    battleState = {
        battleId: null,
        playerId: getCurrentUserId(),
        opponent: null,
        status: 'lobby',
        timeStarted: null,
        challenge: null
    };
}

function backToLobby() {
    document.getElementById('battleResult').style.display = 'none';
    document.getElementById('battleLobby').style.display = 'flex';
    loadAvailableBattles();
}

window.createBattle = createBattle;
window.joinBattle = joinBattle;
window.submitBattleSolution = submitBattleSolution;
window.leaveBattle = leaveBattle;
window.backToLobby = backToLobby;

document.addEventListener('DOMContentLoaded', initializeBattle);
