<?php
require_once 'config.php';

class BattleAPI {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    // Create a new battle
    public function createBattle($player1_id, $challenge_id) {
        $status = 'waiting';
        $stmt = $this->conn->prepare("INSERT INTO battles (player1_id, challenge_id, status) VALUES (?, ?, ?)");
        $stmt->bind_param("iis", $player1_id, $challenge_id, $status);

        if ($stmt->execute()) {
            return ['success' => true, 'battle_id' => $stmt->insert_id, 'message' => 'Battle created, waiting for opponent'];
        } else {
            return ['success' => false, 'message' => 'Failed to create battle'];
        }
    }

    // Join a battle
    public function joinBattle($battle_id, $player2_id) {
        $status = 'in_progress';
        $stmt = $this->conn->prepare("UPDATE battles SET player2_id = ?, status = ? WHERE id = ? AND player2_id IS NULL");
        $stmt->bind_param("isi", $player2_id, $status, $battle_id);

        if ($stmt->execute() && $stmt->affected_rows > 0) {
            return ['success' => true, 'message' => 'Joined battle successfully'];
        } else {
            return ['success' => false, 'message' => 'Failed to join battle or battle already full'];
        }
    }

    // Submit battle solution
    public function submitBattleSolution($battle_id, $player_id, $time_taken) {
        $stmt = $this->conn->prepare("SELECT player1_id, player2_id, status FROM battles WHERE id = ?");
        $stmt->bind_param("i", $battle_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $battle = $result->fetch_assoc();

        if ($battle['status'] !== 'in_progress') {
            return ['success' => false, 'message' => 'Battle is not in progress'];
        }

        if ($player_id === $battle['player1_id']) {
            $update_stmt = $this->conn->prepare("UPDATE battles SET player1_time = ? WHERE id = ?");
        } else {
            $update_stmt = $this->conn->prepare("UPDATE battles SET player2_time = ? WHERE id = ?");
        }

        $update_stmt->bind_param("ii", $time_taken, $battle_id);
        $update_stmt->execute();

        // Check if both players have submitted
        $check_stmt = $this->conn->prepare("SELECT player1_time, player2_time FROM battles WHERE id = ?");
        $check_stmt->bind_param("i", $battle_id);
        $check_stmt->execute();
        $battle_result = $check_stmt->get_result();
        $battle_data = $battle_result->fetch_assoc();

        if (!is_null($battle_data['player1_time']) && !is_null($battle_data['player2_time'])) {
            // Battle complete, determine winner
            $winner_id = $battle_data['player1_time'] < $battle_data['player2_time'] ? $battle['player1_id'] : $battle['player2_id'];
            $status = 'completed';
            $xp_reward = 150;

            $finish_stmt = $this->conn->prepare("UPDATE battles SET winner_id = ?, status = ?, xp_reward = ?, completed_at = NOW() WHERE id = ?");
            $finish_stmt->bind_param("isii", $winner_id, $status, $xp_reward, $battle_id);
            $finish_stmt->execute();

            // Update winner stats
            $winner_stmt = $this->conn->prepare("UPDATE users SET total_battles_won = total_battles_won + 1, total_xp = total_xp + ? WHERE id = ?");
            $winner_stmt->bind_param("ii", $xp_reward, $winner_id);
            $winner_stmt->execute();

            return ['success' => true, 'message' => 'Battle completed', 'winner_id' => $winner_id];
        } else {
            return ['success' => true, 'message' => 'Solution submitted, waiting for opponent'];
        }
    }

    // Get battle details
    public function getBattle($battle_id) {
        $stmt = $this->conn->prepare("
            SELECT b.id, b.player1_id, b.player2_id, b.challenge_id, b.status, 
                   b.winner_id, b.player1_time, b.player2_time, b.xp_reward,
                   u1.username as player1_username, u1.avatar_url as player1_avatar,
                   u2.username as player2_username, u2.avatar_url as player2_avatar
            FROM battles b
            JOIN users u1 ON b.player1_id = u1.id
            LEFT JOIN users u2 ON b.player2_id = u2.id
            WHERE b.id = ?
        ");
        $stmt->bind_param("i", $battle_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            return ['success' => false, 'message' => 'Battle not found'];
        }

        return ['success' => true, 'battle' => $result->fetch_assoc()];
    }

    // Get available battles to join
    public function getAvailableBattles() {
        $status = 'waiting';
        $stmt = $this->conn->prepare("
            SELECT b.id, b.player1_id, b.challenge_id, c.title, c.difficulty,
                   u.username, u.avatar_url, u.level
            FROM battles b
            JOIN challenges c ON b.challenge_id = c.id
            JOIN users u ON b.player1_id = u.id
            WHERE b.status = ? AND b.player2_id IS NULL
            ORDER BY b.created_at DESC
        ");
        $stmt->bind_param("s", $status);
        $stmt->execute();
        $result = $stmt->get_result();

        $battles = [];
        while ($row = $result->fetch_assoc()) {
            $battles[] = $row;
        }

        return ['success' => true, 'battles' => $battles];
    }

    // Get user battle history
    public function getUserBattleHistory($user_id) {
        $stmt = $this->conn->prepare("
            SELECT b.id, b.player1_id, b.player2_id, b.winner_id, 
                   b.player1_time, b.player2_time, b.status, b.xp_reward,
                   c.title, c.difficulty,
                   CASE 
                       WHEN b.winner_id = ? THEN 'Won'
                       WHEN b.winner_id IS NULL AND b.status = 'in_progress' THEN 'In Progress'
                       ELSE 'Lost'
                   END as result
            FROM battles b
            JOIN challenges c ON b.challenge_id = c.id
            WHERE (b.player1_id = ? OR b.player2_id = ?) AND b.status = 'completed'
            ORDER BY b.completed_at DESC
            LIMIT 10
        ");
        $stmt->bind_param("iii", $user_id, $user_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $battles = [];
        while ($row = $result->fetch_assoc()) {
            $battles[] = $row;
        }

        return ['success' => true, 'battles' => $battles];
    }
}

// Handle requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? '';
    $api = new BattleAPI($conn);
    $input = json_decode(file_get_contents('php://input'), true);

    switch ($action) {
        case 'create':
            echo json_encode($api->createBattle($input['player1_id'] ?? 0, $input['challenge_id'] ?? 0));
            break;
        case 'join':
            echo json_encode($api->joinBattle($input['battle_id'] ?? 0, $input['player2_id'] ?? 0));
            break;
        case 'submit':
            echo json_encode($api->submitBattleSolution($input['battle_id'] ?? 0, $input['player_id'] ?? 0, $input['time_taken'] ?? 0));
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $api = new BattleAPI($conn);

    switch ($action) {
        case 'get':
            echo json_encode($api->getBattle($_GET['id'] ?? 0));
            break;
        case 'available':
            echo json_encode($api->getAvailableBattles());
            break;
        case 'history':
            echo json_encode($api->getUserBattleHistory($_GET['user_id'] ?? 0));
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
}

?>
