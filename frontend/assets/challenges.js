/* Challenges Page JavaScript */

let allChallenges = [];
let filteredChallenges = [];
let currentChallenge = null;
let currentChallengeDifficulty = 'all';

async function initializeChallenges() {
    if (!isLoggedIn()) {
        navigateTo('index.html');
        return;
    }

    const response = await API.getAllChallenges();
    if (response.success) {
        allChallenges = response.challenges;
        filteredChallenges = allChallenges;
        displayChallenges(allChallenges);
    }

    initializeAnimations();
}

function displayChallenges(challenges) {
    const container = document.getElementById('challengesContainer');
    if (!container) return;

    container.innerHTML = '';

    challenges.forEach((challenge, index) => {
        const card = document.createElement('div');
        card.className = 'challenge-card';

        let difficultyColor = '#3B82F6';
        if (challenge.difficulty === 'Easy') difficultyColor = '#10B981';
        else if (challenge.difficulty === 'Medium') difficultyColor = '#F59E0B';
        else if (challenge.difficulty === 'Hard') difficultyColor = '#EF4444';

        card.style.background = `linear-gradient(135deg, ${difficultyColor} 0%, ${difficultyColor}dd 100%)`;

        card.innerHTML = `
            <div class="challenge-header">
                <div class="challenge-icon">🧩</div>
                <div class="xp-reward">+${challenge.xp_reward} XP</div>
            </div>
            <h3 class="challenge-title">${challenge.title}</h3>
            <p class="challenge-description">${challenge.description ? challenge.description.substring(0, 100) + '...' : ''}</p>
            <div class="challenge-meta">
                <div class="difficulty-meter">
                    ${Array(
                        challenge.difficulty === 'Easy' ? 1 : challenge.difficulty === 'Medium' ? 2 : 3
                    ).fill(0).map(() => '<div class="difficulty-bar active"></div>').join('')}
                </div>
                <div class="challenge-difficulty">${challenge.difficulty}</div>
            </div>
        `;

        card.addEventListener('click', () => {
            openChallengeModal(challenge);
        });

        container.appendChild(card);

        gsap.from(card, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            delay: index * 0.05,
            ease: 'back.out'
        });
    });
}

function filterChallenges(difficulty) {
    currentChallengeDifficulty = difficulty;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    if (difficulty === 'all') {
        filteredChallenges = allChallenges;
    } else {
        filteredChallenges = allChallenges.filter(c => c.difficulty === difficulty);
    }

    displayChallenges(filteredChallenges);
}

async function openChallengeModal(challenge) {
    currentChallenge = challenge;

    const modal = document.getElementById('challengeModal');
    document.getElementById('modalTitle').textContent = challenge.title;
    document.getElementById('modalDescription').textContent = challenge.description;

    // Load challenge template
    if (challenge.code_template) {
        document.getElementById('codeEditor').value = challenge.code_template;
    } else {
        document.getElementById('codeEditor').value = '// Write your solution here\n\n';
    }

    modal.classList.add('active');
    gsap.from(modal.querySelector('.modal-content'), {
        opacity: 0,
        y: 50,
        duration: 0.4,
        ease: 'back.out'
    });
}

function closeModal() {
    const modal = document.getElementById('challengeModal');
    gsap.to(modal.querySelector('.modal-content'), {
        opacity: 0,
        y: 50,
        duration: 0.3,
        ease: 'back.in',
        onComplete: () => {
            modal.classList.remove('active');
        }
    });
}

function runCode() {
    const code = document.getElementById('codeEditor').value;
    const output = document.getElementById('codeOutput');
    const outputText = document.getElementById('outputText');

    // Simple code execution (in production, use a sandboxed environment)
    try {
        let result = '';
        // Capture console.log
        const originalLog = console.log;
        console.log = function(...args) {
            result += args.join(' ') + '\n';
        };

        // Execute code
        new Function(code)();

        console.log = originalLog;
        outputText.textContent = result || 'Code executed successfully!';
    } catch (error) {
        outputText.textContent = 'Error: ' + error.message;
    }

    output.style.display = 'block';
    gsap.from(output, {
        opacity: 0,
        y: 10,
        duration: 0.3,
        ease: 'back.out'
    });
}

async function submitChallenge() {
    if (!currentChallenge || !isLoggedIn()) {
        showNotification('Error: Challenge or user not found', 'error');
        return;
    }

    const code = document.getElementById('codeEditor').value;
    const userId = getCurrentUserId();

    showNotification('Submitting solution...', 'info');

    const response = await API.submitChallengeSolution(
        userId,
        currentChallenge.id,
        code,
        10 // time_taken in seconds (simplified)
    );

    if (response.success) {
        showNotification(`Challenge completed! +${response.xp_earned} XP`, 'success');
        triggerConfetti(100);
        createSuccessParticles(document.querySelector('.btn-success'));

        // Update XP
        await API.updateXP(userId, response.xp_earned);

        setTimeout(() => {
            closeModal();
            initializeChallenges();
        }, 1500);
    } else {
        showNotification(response.message || 'Solution incorrect', 'error');
        shakeScreen(300);
    }
}

// Close modal on outside click
window.addEventListener('click', (event) => {
    const modal = document.getElementById('challengeModal');
    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener('DOMContentLoaded', initializeChallenges);
