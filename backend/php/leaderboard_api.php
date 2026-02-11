<?php
require_once 'config.php';

class LeaderboardAPI {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    // Get global leaderboard
    public function getGlobalLeaderboard($limit = 50) {
        $stmt = $this->conn->prepare("
            SELECT 
                u.id,
                u.username,
                u.avatar_url,
                u.level,
                u.total_xp,
                u.total_challenges_completed,
                u.total_battles_won,
                ROW_NUMBER() OVER (ORDER BY u.total_xp DESC) as rank
            FROM users u
            ORDER BY u.total_xp DESC
            LIMIT ?
        ");
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $leaderboard = [];
        while ($row = $result->fetch_assoc()) {
            $leaderboard[] = $row;
        }

        return ['success' => true, 'leaderboard' => $leaderboard];
    }

    // Get weekly leaderboard
    public function getWeeklyLeaderboard($limit = 50) {
        $week_start = date('Y-m-d', strtotime('monday this week'));
        $week_end = date('Y-m-d', strtotime('sunday this week'));

        $stmt = $this->conn->prepare("
            SELECT 
                u.id,
                u.username,
                u.avatar_url,
                u.level,
                SUM(CASE WHEN uc.completed_at >= ? AND uc.completed_at <= ? THEN uc.xp_earned ELSE 0 END) as weekly_xp,
                COUNT(CASE WHEN uc.completed_at >= ? AND uc.completed_at <= ? THEN 1 END) as weekly_challenges,
                ROW_NUMBER() OVER (ORDER BY weekly_xp DESC) as rank
            FROM users u
            LEFT JOIN user_challenges uc ON u.id = uc.user_id
            GROUP BY u.id
            ORDER BY weekly_xp DESC
            LIMIT ?
        ");
        $stmt->bind_param("ssssi", $week_start, $week_end, $week_start, $week_end, $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $leaderboard = [];
        while ($row = $result->fetch_assoc()) {
            $leaderboard[] = $row;
        }

        return ['success' => true, 'leaderboard' => $leaderboard];
    }

    // Get user rank
    public function getUserRank($user_id) {
        $stmt = $this->conn->prepare("
            SELECT 
                COUNT(*) + 1 as rank
            FROM users
            WHERE total_xp > (SELECT total_xp FROM users WHERE id = ?)
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();

        return ['success' => true, 'rank' => $row['rank']];
    }

    // Get friends leaderboard
    public function getFriendsLeaderboard($user_id, $limit = 20) {
        // Note: This assumes there's a friends table. Simplified version here.
        $stmt = $this->conn->prepare("
            SELECT 
                u.id,
                u.username,
                u.avatar_url,
                u.level,
                u.total_xp,
                u.total_challenges_completed,
                CASE WHEN u.id = ? THEN 'YOU' ELSE '' END as label,
                ROW_NUMBER() OVER (ORDER BY u.total_xp DESC) as rank
            FROM users u
            ORDER BY u.total_xp DESC
            LIMIT ?
        ");
        $stmt->bind_param("ii", $user_id, $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $leaderboard = [];
        while ($row = $result->fetch_assoc()) {
            $leaderboard[] = $row;
        }

        return ['success' => true, 'leaderboard' => $leaderboard];
    }

    // Get top challengers
    public function getTopChallengers($limit = 10) {
        $stmt = $this->conn->prepare("
            SELECT 
                u.id,
                u.username,
                u.avatar_url,
                u.level,
                u.total_challenges_completed,
                ROW_NUMBER() OVER (ORDER BY u.total_challenges_completed DESC) as rank
            FROM users u
            ORDER BY u.total_challenges_completed DESC
            LIMIT ?
        ");
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $challengers = [];
        while ($row = $result->fetch_assoc()) {
            $challengers[] = $row;
        }

        return ['success' => true, 'challengers' => $challengers];
    }

    // Get top battle winners
    public function getTopBattleWinners($limit = 10) {
        $stmt = $this->conn->prepare("
            SELECT 
                u.id,
                u.username,
                u.avatar_url,
                u.level,
                u.total_battles_won,
                ROW_NUMBER() OVER (ORDER BY u.total_battles_won DESC) as rank
            FROM users u
            ORDER BY u.total_battles_won DESC
            LIMIT ?
        ");
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        $result = $stmt->get_result();

        $winners = [];
        while ($row = $result->fetch_assoc()) {
            $winners[] = $row;
        }

        return ['success' => true, 'winners' => $winners];
    }
}

// Handle requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $api = new LeaderboardAPI($conn);

    switch ($action) {
        case 'global':
            $limit = $_GET['limit'] ?? 50;
            echo json_encode($api->getGlobalLeaderboard($limit));
            break;
        case 'weekly':
            $limit = $_GET['limit'] ?? 50;
            echo json_encode($api->getWeeklyLeaderboard($limit));
            break;
        case 'user_rank':
            echo json_encode($api->getUserRank($_GET['user_id'] ?? 0));
            break;
        case 'friends':
            $limit = $_GET['limit'] ?? 20;
            echo json_encode($api->getFriendsLeaderboard($_GET['user_id'] ?? 0, $limit));
            break;
        case 'top_challengers':
            $limit = $_GET['limit'] ?? 10;
            echo json_encode($api->getTopChallengers($limit));
            break;
        case 'top_winners':
            $limit = $_GET['limit'] ?? 10;
            echo json_encode($api->getTopBattleWinners($limit));
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
}

?>
