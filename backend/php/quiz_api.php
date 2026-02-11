<?php
require_once 'config.php';

class QuizAPI {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    // Get random quiz question
    public function getRandomQuestion($difficulty = null) {
        if ($difficulty) {
            $stmt = $this->conn->prepare("SELECT id, question, option_a, option_b, option_c, option_d, category, difficulty, UPPER(correct_option) as correct_option FROM quiz_questions WHERE difficulty = ? ORDER BY RAND() LIMIT 1");
            $stmt->bind_param("s", $difficulty);
        } else {
            $stmt = $this->conn->prepare("SELECT id, question, option_a, option_b, option_c, option_d, category, difficulty, UPPER(correct_option) as correct_option FROM quiz_questions ORDER BY RAND() LIMIT 1");
        }

        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            return ['success' => false, 'message' => 'No questions found'];
        }

        return ['success' => true, 'question' => $result->fetch_assoc()];
    }

    // Submit quiz answer
    public function submitAnswer($user_id, $question_id, $user_answer, $time_taken) {
        $stmt = $this->conn->prepare("SELECT UPPER(correct_option) as correct_option, explanation FROM quiz_questions WHERE id = ?");
        $stmt->bind_param("i", $question_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $question = $result->fetch_assoc();

        if (!$question) {
            return ['success' => false, 'message' => 'Question not found'];
        }

        $user_answer = strtoupper(trim($user_answer));
        $is_correct = ($user_answer === $question['correct_option']);
        $xp_earned = $is_correct ? 50 : 0;

        // Record attempt
        $insert_stmt = $this->conn->prepare("INSERT INTO quiz_attempts (user_id, question_id, user_answer, is_correct, time_taken, xp_earned) VALUES (?, ?, ?, ?, ?, ?)");
        $correct_val = $is_correct ? 1 : 0;
        $insert_stmt->bind_param("iissii", $user_id, $question_id, $user_answer, $correct_val, $time_taken, $xp_earned);
        $insert_stmt->execute();

        return [
            'success' => true,
            'is_correct' => $is_correct,
            'correct_option' => $question['correct_option'],
            'explanation' => $question['explanation'],
            'xp_earned' => $xp_earned
        ];
    }

    // Get quiz stats for user
    public function getQuizStats($user_id) {
        $stmt = $this->conn->prepare("
            SELECT 
                COUNT(*) as total_attempts,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
                ROUND(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as accuracy,
                SUM(xp_earned) as total_xp_from_quiz
            FROM quiz_attempts
            WHERE user_id = ?
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $stats = $result->fetch_assoc();

        return ['success' => true, 'stats' => $stats];
    }

    // Get quiz categories
    public function getCategories() {
        $stmt = $this->conn->prepare("SELECT DISTINCT category FROM quiz_questions ORDER BY category");
        $stmt->execute();
        $result = $stmt->get_result();

        $categories = [];
        while ($row = $result->fetch_assoc()) {
            $categories[] = $row['category'];
        }

        return ['success' => true, 'categories' => $categories];
    }

    // Get quiz by category
    public function getQuestionByCategory($category, $difficulty = null) {
        if ($difficulty) {
            $stmt = $this->conn->prepare("SELECT id, question, option_a, option_b, option_c, option_d, category, difficulty, UPPER(correct_option) as correct_option FROM quiz_questions WHERE category = ? AND difficulty = ? ORDER BY RAND() LIMIT 1");
            $stmt->bind_param("ss", $category, $difficulty);
        } else {
            $stmt = $this->conn->prepare("SELECT id, question, option_a, option_b, option_c, option_d, category, difficulty, UPPER(correct_option) as correct_option FROM quiz_questions WHERE category = ? ORDER BY RAND() LIMIT 1");
            $stmt->bind_param("s", $category);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            return ['success' => false, 'message' => 'No questions found'];
        }

        return ['success' => true, 'question' => $result->fetch_assoc()];
    }
}

// Handle requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_GET['action'] ?? '';
    $api = new QuizAPI($conn);
    $input = json_decode(file_get_contents('php://input'), true);

    switch ($action) {
        case 'submit':
            echo json_encode($api->submitAnswer($input['user_id'] ?? 0, $input['question_id'] ?? 0, $input['user_answer'] ?? '', $input['time_taken'] ?? 0));
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $api = new QuizAPI($conn);

    switch ($action) {
        case 'random':
            $difficulty = $_GET['difficulty'] ?? null;
            echo json_encode($api->getRandomQuestion($difficulty));
            break;
        case 'stats':
            echo json_encode($api->getQuizStats($_GET['user_id'] ?? 0));
            break;
        case 'categories':
            echo json_encode($api->getCategories());
            break;
        case 'by_category':
            $category = $_GET['category'] ?? '';
            $difficulty = $_GET['difficulty'] ?? null;
            echo json_encode($api->getQuestionByCategory($category, $difficulty));
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
}

?>
