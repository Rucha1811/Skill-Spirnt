-- SkillSprint New Database Schema
-- MySQL/MariaDB

CREATE DATABASE IF NOT EXISTS skillsprint_new;
USE skillsprint_new;

-- Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    level INT DEFAULT 1,
    total_xp INT DEFAULT 0,
    current_xp INT DEFAULT 0,
    xp_for_next_level INT DEFAULT 100,
    streak_count INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_challenge_date DATE,
    total_challenges_completed INT DEFAULT 0,
    total_battles_won INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Badges Table
CREATE TABLE badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    icon_url VARCHAR(255),
    unlock_requirement VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Badges (Many-to-Many)
CREATE TABLE user_badges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Challenges Table
CREATE TABLE challenges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50),
    difficulty VARCHAR(20),
    xp_reward INT,
    code_template TEXT,
    test_cases JSON,
    solution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Challenge Progress
CREATE TABLE user_challenges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    challenge_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    attempts INT DEFAULT 0,
    best_time INT,
    xp_earned INT DEFAULT 0,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_challenge (user_id, challenge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily Challenges
CREATE TABLE daily_challenges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    challenge_id INT NOT NULL,
    date_assigned DATE UNIQUE NOT NULL,
    xp_multiplier DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Battles Table
CREATE TABLE battles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player1_id INT NOT NULL,
    player2_id INT,
    challenge_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting',
    winner_id INT,
    player1_time INT,
    player2_time INT,
    xp_reward INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz Questions Table
CREATE TABLE quiz_questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question TEXT NOT NULL,
    option_a VARCHAR(255),
    option_b VARCHAR(255),
    option_c VARCHAR(255),
    option_d VARCHAR(255),
    correct_option VARCHAR(1),
    category VARCHAR(50),
    difficulty VARCHAR(20),
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quiz Attempts
CREATE TABLE quiz_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    user_answer VARCHAR(1),
    is_correct BOOLEAN,
    time_taken INT,
    xp_earned INT DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leaderboard (View-based, updated periodically)
CREATE TABLE leaderboard (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    rank INT,
    total_xp INT,
    challenges_completed INT,
    battles_won INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_leaderboard (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    message VARCHAR(255),
    notification_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Streak Calendar
CREATE TABLE streak_calendar (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    completed_challenge BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Indexes for Performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_level ON users(level);
CREATE INDEX idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX idx_user_challenges_status ON user_challenges(status);
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_streak_calendar_user ON streak_calendar(user_id);

-- Sample Data
INSERT INTO badges (name, description, icon_url, unlock_requirement) VALUES
('Fast Solver', 'Complete challenges under 2 minutes', '⚡', 'complete_5_challenges_under_2min'),
('7-Day Streak', 'Maintain a 7-day challenge streak', '🔥', 'streak_7_days'),
('Coding Beast', 'Win 10 battles consecutively', '🦾', 'win_10_battles'),
('Code Wizard', 'Complete 50 challenges', '🧙', 'complete_50_challenges'),
('Battle Master', 'Win 25 battles total', '⚔️', 'win_25_battles');

-- Sample Challenges
INSERT INTO challenges (title, description, category, difficulty, xp_reward, code_template) VALUES
('Sum Array Elements', 'Write a function to sum all elements in an array', 'JavaScript', 'Easy', 50, 'function sumArray(arr) {\n  // Your code here\n}'),
('Find Duplicate', 'Find the first duplicate element in an array', 'JavaScript', 'Medium', 100, 'function findDuplicate(arr) {\n  // Your code here\n}'),
('Reverse String', 'Reverse a given string without using built-in methods', 'JavaScript', 'Easy', 50, 'function reverseString(str) {\n  // Your code here\n}');

-- Sample Quiz Questions
INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_option, category, difficulty, explanation) VALUES
('What is the time complexity of binary search?', 'O(n)', 'O(log n)', 'O(n²)', 'O(1)', 'B', 'Algorithms', 'Medium', 'Binary search divides the search space in half each time'),
('Which sorting algorithm is most efficient for large datasets?', 'Bubble Sort', 'Quick Sort', 'Insertion Sort', 'Selection Sort', 'B', 'Algorithms', 'Medium', 'Quick Sort has average time complexity of O(n log n)'),
('What does SQL stand for?', 'Structured Query Language', 'System Query Language', 'Standard Question Language', 'Software Query Language', 'A', 'Database', 'Easy', 'SQL is the standard language for database management');
