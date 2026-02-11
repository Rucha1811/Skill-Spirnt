/* API Service */

const API = {
    // Auth Methods
    async register(username, email, password) {
        return this.registerUser(username, email, password);
    },

    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE}/users_api.php?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message };
        }
    },

    // Users
    async registerUser(username, email, password) {
        try {
            const response = await fetch(`${API_BASE}/users_api.php?action=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: error.message };
        }
    },

    async loginUser(username, password) {
        try {
            const response = await fetch(`${API_BASE}/users_api.php?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message };
        }
    },

    async getUserProfile(userId) {
        try {
            const response = await fetch(`${API_BASE}/users_api.php?action=profile&user_id=${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Profile error:', error);
            return { success: false, message: error.message };
        }
    },

    async updateXP(userId, xpGained) {
        try {
            const response = await fetch(`${API_BASE}/users_api.php?action=update_xp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, xp_gained: xpGained })
            });
            return await response.json();
        } catch (error) {
            console.error('Update XP error:', error);
            return { success: false, message: error.message };
        }
    },

    async getUserBadges(userId) {
        try {
            const response = await fetch(`${API_BASE}/users_api.php?action=badges&user_id=${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Get badges error:', error);
            return { success: false, badges: [] };
        }
    },

    // Challenges
    async getAllChallenges() {
        try {
            const response = await fetch(`${API_BASE}/challenges_api.php?action=all`);
            return await response.json();
        } catch (error) {
            console.error('Get challenges error:', error);
            return { success: false, challenges: [] };
        }
    },

    async getChallenge(challengeId) {
        try {
            const response = await fetch(`${API_BASE}/challenges_api.php?action=get&id=${challengeId}`);
            return await response.json();
        } catch (error) {
            console.error('Get challenge error:', error);
            return { success: false, challenge: null };
        }
    },

    async getDailyChallenges() {
        try {
            const response = await fetch(`${API_BASE}/challenges_api.php?action=daily`);
            return await response.json();
        } catch (error) {
            console.error('Get daily challenges error:', error);
            return { success: false, challenges: [] };
        }
    },

    async submitChallengeSolution(userId, challengeId, code, timeTaken) {
        try {
            const response = await fetch(`${API_BASE}/challenges_api.php?action=submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    challenge_id: challengeId,
                    code: code,
                    time_taken: timeTaken
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Submit solution error:', error);
            return { success: false, message: error.message };
        }
    },

    // Battles
    async createBattle(player1Id, challengeId) {
        try {
            const response = await fetch(`${API_BASE}/battles_api.php?action=create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player1_id: player1Id, challenge_id: challengeId })
            });
            return await response.json();
        } catch (error) {
            console.error('Create battle error:', error);
            return { success: false, message: error.message };
        }
    },

    async getAvailableBattles() {
        try {
            const response = await fetch(`${API_BASE}/battles_api.php?action=available`);
            return await response.json();
        } catch (error) {
            console.error('Get battles error:', error);
            return { success: false, battles: [] };
        }
    },

    async joinBattle(battleId, player2Id) {
        try {
            const response = await fetch(`${API_BASE}/battles_api.php?action=join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ battle_id: battleId, player2_id: player2Id })
            });
            return await response.json();
        } catch (error) {
            console.error('Join battle error:', error);
            return { success: false, message: error.message };
        }
    },

    async submitBattleSolution(battleId, playerId, timeTaken) {
        try {
            const response = await fetch(`${API_BASE}/battles_api.php?action=submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ battle_id: battleId, player_id: playerId, time_taken: timeTaken })
            });
            return await response.json();
        } catch (error) {
            console.error('Submit battle solution error:', error);
            return { success: false, message: error.message };
        }
    },

    // Quiz
    async getRandomQuestion(difficulty = null) {
        try {
            const url = difficulty
                ? `${API_BASE}/quiz_api.php?action=random&difficulty=${difficulty}`
                : `${API_BASE}/quiz_api.php?action=random`;
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Get question error:', error);
            return { success: false, question: null };
        }
    },

    async submitQuizAnswer(userId, questionId, userAnswer, timeTaken) {
        try {
            const response = await fetch(`${API_BASE}/quiz_api.php?action=submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    question_id: questionId,
                    user_answer: userAnswer,
                    time_taken: timeTaken
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Submit quiz answer error:', error);
            return { success: false, message: error.message };
        }
    },

    async getQuizStats(userId) {
        try {
            const response = await fetch(`${API_BASE}/quiz_api.php?action=stats&user_id=${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Get quiz stats error:', error);
            return { success: false, stats: {} };
        }
    },

    // Leaderboard
    async getGlobalLeaderboard(limit = 50) {
        try {
            const response = await fetch(`${API_BASE}/leaderboard_api.php?action=global&limit=${limit}`);
            return await response.json();
        } catch (error) {
            console.error('Get leaderboard error:', error);
            return { success: false, leaderboard: [] };
        }
    },

    async getWeeklyLeaderboard(limit = 50) {
        try {
            const response = await fetch(`${API_BASE}/leaderboard_api.php?action=weekly&limit=${limit}`);
            return await response.json();
        } catch (error) {
            console.error('Get weekly leaderboard error:', error);
            return { success: false, leaderboard: [] };
        }
    },

    async getUserRank(userId) {
        try {
            const response = await fetch(`${API_BASE}/leaderboard_api.php?action=user_rank&user_id=${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Get user rank error:', error);
            return { success: false, rank: 0 };
        }
    },

    // Python Backend Services
    async getNotifications(userId, limit = 10) {
        try {
            const response = await fetch(`${PYTHON_API_BASE}/notifications/${userId}?limit=${limit}`);
            return await response.json();
        } catch (error) {
            console.error('Get notifications error:', error);
            return { success: false, notifications: [] };
        }
    },

    async updateStreak(userId) {
        try {
            const response = await fetch(`${PYTHON_API_BASE}/streak/${userId}`, {
                method: 'POST'
            });
            return await response.json();
        } catch (error) {
            console.error('Update streak error:', error);
            return { success: false, message: error.message };
        }
    },

    async checkBadges(userId) {
        try {
            const response = await fetch(`${PYTHON_API_BASE}/badges/${userId}/check`, {
                method: 'POST'
            });
            return await response.json();
        } catch (error) {
            console.error('Check badges error:', error);
            return { success: false, badges_unlocked: [] };
        }
    },

    async getLeaderboardList(limit = 10) {
        try {
            const response = await fetch(`${PYTHON_API_BASE}/leaderboard?limit=${limit}`);
            return await response.json();
        } catch (error) {
            console.error('Get leaderboard list error:', error);
            return { success: false, users: [] };
        }
    }
};

window.API = API;
