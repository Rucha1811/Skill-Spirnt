<?php
require_once 'config.php';

class ChallengeAPI {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    // Get all challenges
    public function getAllChallenges() {
        $stmt = $this->conn->prepare("SELECT id, title, description, category, difficulty, xp_reward FROM challenges ORDER BY difficulty ASC");
        $stmt->execute();
        $result = $stmt->get_result();

        $challenges = [];
        while ($row = $result->fetch_assoc()) {
            $challenges[] = $row;
        }

        return ['success' => true, 'challenges' => $challenges];
    }

    // Get challenge by ID
    public function getChallenge($challenge_id) {
        $stmt = $this->conn->prepare("SELECT id, title, description, category, difficulty, xp_reward, code_template, test_cases, solution FROM challenges WHERE id = ?");
        $stmt->bind_param("i", $challenge_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            return ['success' => false, 'message' => 'Challenge not found'];
        }

        return ['success' => true, 'challenge' => $result->fetch_assoc()];
    }

    // Get daily challenges
    public function getDailyChallenges() {
        $today = date('Y-m-d');
        $stmt = $this->conn->prepare("
            SELECT c.id, c.title, c.description, c.difficulty, c.xp_reward, dc.xp_multiplier
            FROM challenges c
            JOIN daily_challenges dc ON c.id = dc.challenge_id
            WHERE dc.date_assigned = ?
        ");
        $stmt->bind_param("s", $today);
        $stmt->execute();
        $result = $stmt->get_result();

        $challenges = [];
        while ($row = $result->fetch_assoc()) {
            $challenges[] = $row;
        }

        return ['success' => true, 'challenges' => $challenges];
    }

    // Submit challenge solution
    public function submitSolution($user_id, $challenge_id, $code, $time_taken) {
        // Check if solution is correct (basic validation)
        $stmt = $this->conn->prepare("SELECT id, solution FROM challenges WHERE id = ?");
        $stmt->bind_param("i", $challenge_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $challenge = $result->fetch_assoc();

        // In real scenario, this would execute and test the code
        $is_correct = true;

        if ($is_correct) {
            // Get challenge XP reward
            $xp_stmt = $this->conn->prepare("SELECT xp_reward FROM challenges WHERE id = ?");
            $xp_stmt->bind_param("i", $challenge_id);
            $xp_stmt->execute();
            $xp_result = $xp_stmt->get_result();
            $xp_row = $xp_result->fetch_assoc();
            $xp_reward = $xp_row['xp_reward'];

            // Update user challenge
            $update_stmt = $this->conn->prepare("
                INSERT INTO user_challenges (user_id, challenge_id, status, attempts, best_time, xp_earned, completed_at)
                VALUES (?, ?, 'completed', 1, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE status = 'completed', attempts = attempts + 1, best_time = LEAST(best_time, VALUES(best_time)), xp_earned = VALUES(xp_earned), completed_at = NOW()
            ");
            $update_stmt->bind_param("iiii", $user_id, $challenge_id, $time_taken, $xp_reward);
            $update_stmt->execute();

            // Increment total challenges completed
            $inc_stmt = $this->conn->prepare("UPDATE users SET total_challenges_completed = total_challenges_completed + 1 WHERE id = ?");
            $inc_stmt->bind_param("i", $user_id);
            $inc_stmt->execute();

            return ['success' => true, 'message' => 'Challenge completed!', 'xp_earned' => $xp_reward];
        } else {
            $attempt_stmt = $this->conn->prepare("UPDATE user_challenges SET attempts = attempts + 1 WHERE user_id = ? AND challenge_id = ?");
            $attempt_stmt->bind_param("ii", $user_id, $challenge_id);
            $attempt_stmt->execute();

            return ['success' => false, 'message' => 'Solution incorrect, try again'];
        }
    }

    // Get user challenge progress
    public function getUserChallengeProgress($user_id, $challenge_id) {
        $stmt = $this->conn->prepare("SELECT status, attempts, best_time, xp_earned FROM user_challenges WHERE user_id = ? AND challenge_id = ?");
        $stmt->bind_param("ii", $user_id, $challenge_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            return ['success' => true, 'progress' => null];
        }

        return ['success' => true, 'progress' => $result->fetch_assoc()];
    }

    // Get user completed challenges
    public function getUserCompletedChallenges($user_id) {
        $stmt = $this->conn->prepare("
            SELECT c.id, c.title, c.difficulty, uc.status, uc.best_time, uc.xp_earned
            FROM challenges c
            JOIN user_challenges uc ON c.id = uc.challenge_id
            WHERE uc.user_id = ? AND uc.status = 'completed'
            ORDER BY uc.completed_at DESC
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $challenges = [];
        while ($row = $result->fetch_assoc()) {
            $challenges[] = $row;
        }

        return ['success' => true, 'challenges' => $challenges];
    }
}

// Handle requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? '';
    $api = new ChallengeAPI($conn);
    $input = json_decode(file_get_contents('php://input'), true);

    switch ($action) {
        case 'submit':
            echo json_encode($api->submitSolution($input['user_id'] ?? 0, $input['challenge_id'] ?? 0, $input['code'] ?? '', $input['time_taken'] ?? 0));
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $api = new ChallengeAPI($conn);

    switch ($action) {
        case 'all':
            echo json_encode($api->getAllChallenges());
            break;
        case 'get':
            echo json_encode($api->getChallenge($_GET['id'] ?? 0));
            break;
        case 'daily':
            echo json_encode($api->getDailyChallenges());
            break;
        case 'progress':
            echo json_encode($api->getUserChallengeProgress($_GET['user_id'] ?? 0, $_GET['challenge_id'] ?? 0));
            break;
        case 'completed':
            echo json_encode($api->getUserCompletedChallenges($_GET['user_id'] ?? 0));
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
}

?>
