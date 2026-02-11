<?php
require_once 'config.php';

class UserAPI {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    // Register new user
    public function register($username, $email, $password) {
        if (empty($username) || empty($email) || empty($password)) {
            return ['success' => false, 'message' => 'Missing required fields'];
        }

        $password_hash = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $this->conn->prepare("INSERT INTO users (username, email, password_hash, avatar_url) VALUES (?, ?, ?, ?)");
        $avatar_url = "https://api.dicebear.com/7.x/avataaars/svg?seed=" . urlencode($username);

        $stmt->bind_param("ssss", $username, $email, $password_hash, $avatar_url);

        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'User registered successfully', 'user_id' => $stmt->insert_id];
        } else {
            return ['success' => false, 'message' => 'Registration failed: ' . $stmt->error];
        }
    }

    // Login user - accept either email or username
    public function login($email_or_username, $password) {
        $stmt = $this->conn->prepare("SELECT id, username, email, password_hash, avatar_url, level, total_xp FROM users WHERE email = ? OR username = ?");
        $stmt->bind_param("ss", $email_or_username, $email_or_username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            return ['success' => false, 'message' => 'User not found'];
        }

        $user = $result->fetch_assoc();

        if (password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']);
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            return ['success' => true, 'message' => 'Login successful', 'user' => $user];
        } else {
            return ['success' => false, 'message' => 'Invalid password'];
        }
    }

    // Get user profile
    public function getProfile($user_id) {
        $stmt = $this->conn->prepare("SELECT id, username, email, avatar_url, level, total_xp, current_xp, xp_for_next_level, streak_count, longest_streak, total_challenges_completed, total_battles_won FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            return ['success' => false, 'message' => 'User not found'];
        }

        $user = $result->fetch_assoc();
        return ['success' => true, 'user' => $user];
    }

    // Update user XP
    public function updateXP($user_id, $xp_gained) {
        $stmt = $this->conn->prepare("SELECT level, total_xp, current_xp, xp_for_next_level FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        $new_current_xp = $user['current_xp'] + $xp_gained;
        $new_total_xp = $user['total_xp'] + $xp_gained;
        $new_level = $user['level'];
        $level_up = false;

        // Check for level up
        while ($new_current_xp >= $user['xp_for_next_level']) {
            $new_current_xp -= $user['xp_for_next_level'];
            $new_level++;
            $user['xp_for_next_level'] = $user['xp_for_next_level'] + 50; // Increase next level requirement
            $level_up = true;
        }

        $update_stmt = $this->conn->prepare("UPDATE users SET total_xp = ?, current_xp = ?, level = ?, xp_for_next_level = ? WHERE id = ?");
        $update_stmt->bind_param("iiiii", $new_total_xp, $new_current_xp, $new_level, $user['xp_for_next_level'], $user_id);
        $update_stmt->execute();

        return ['success' => true, 'xp_gained' => $xp_gained, 'level_up' => $level_up, 'new_level' => $new_level, 'new_total_xp' => $new_total_xp];
    }

    // Update user streak
    public function updateStreak($user_id) {
        $today = date('Y-m-d');
        $stmt = $this->conn->prepare("SELECT COUNT(*) as count FROM streak_calendar WHERE user_id = ? AND date = ?");
        $stmt->bind_param("is", $user_id, $today);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();

        if ($row['count'] == 0) {
            // Add today to streak
            $insert_stmt = $this->conn->prepare("INSERT INTO streak_calendar (user_id, date, completed_challenge) VALUES (?, ?, TRUE)");
            $insert_stmt->bind_param("is", $user_id, $today);
            $insert_stmt->execute();

            // Update streak count
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            $check_stmt = $this->conn->prepare("SELECT COUNT(*) as count FROM streak_calendar WHERE user_id = ? AND date = ?");
            $check_stmt->bind_param("is", $user_id, $yesterday);
            $check_stmt->execute();
            $check_result = $check_stmt->get_result();
            $check_row = $check_result->fetch_assoc();

            if ($check_row['count'] > 0) {
                // Streak continues
                $streak_stmt = $this->conn->prepare("UPDATE users SET streak_count = streak_count + 1 WHERE id = ?");
                $streak_stmt->bind_param("i", $user_id);
                $streak_stmt->execute();
            } else {
                // Streak resets
                $streak_stmt = $this->conn->prepare("UPDATE users SET streak_count = 1 WHERE id = ?");
                $streak_stmt->bind_param("i", $user_id);
                $streak_stmt->execute();
            }
        }

        return ['success' => true, 'message' => 'Streak updated'];
    }

    // Get user badges
    public function getBadges($user_id) {
        $stmt = $this->conn->prepare("
            SELECT b.id, b.name, b.description, b.icon_url, ub.unlocked_at 
            FROM badges b 
            LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
            ORDER BY ub.unlocked_at DESC
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $badges = [];
        while ($row = $result->fetch_assoc()) {
            $badges[] = $row;
        }

        return ['success' => true, 'badges' => $badges];
    }

    // Unlock badge
    public function unlockBadge($user_id, $badge_id) {
        $stmt = $this->conn->prepare("INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)");
        $stmt->bind_param("ii", $user_id, $badge_id);

        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Badge unlocked!'];
        } else {
            return ['success' => false, 'message' => 'Failed to unlock badge'];
        }
    }
}

// Handle requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? '';
    $api = new UserAPI($conn);
    $input = json_decode(file_get_contents('php://input'), true);

    switch ($action) {
        case 'register':
            echo json_encode($api->register($input['username'] ?? '', $input['email'] ?? '', $input['password'] ?? ''));
            break;
        case 'login':
            session_start();
            echo json_encode($api->login($input['email'] ?? $input['username'] ?? '', $input['password'] ?? ''));
            break;
        case 'update_xp':
            echo json_encode($api->updateXP($input['user_id'] ?? 0, $input['xp_gained'] ?? 0));
            break;
        case 'update_streak':
            echo json_encode($api->updateStreak($input['user_id'] ?? 0));
            break;
        case 'unlock_badge':
            echo json_encode($api->unlockBadge($input['user_id'] ?? 0, $input['badge_id'] ?? 0));
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    session_start();
    $action = $_GET['action'] ?? '';
    $api = new UserAPI($conn);

    switch ($action) {
        case 'profile':
            $user_id = $_GET['user_id'] ?? 0;
            echo json_encode($api->getProfile($user_id));
            break;
        case 'badges':
            $user_id = $_GET['user_id'] ?? 0;
            echo json_encode($api->getBadges($user_id));
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
}

?>
