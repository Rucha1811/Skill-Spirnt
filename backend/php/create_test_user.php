<?php
require_once 'config.php';

// Create test user with email: test@skillsprint.io, password: password
$username = 'testuser';
$email = 'test@skillsprint.io';
$password = 'password';
$password_hash = password_hash($password, PASSWORD_BCRYPT);

$avatar_url = "https://api.dicebear.com/7.x/avataaars/svg?seed=" . urlencode($username);

$stmt = $conn->prepare("INSERT INTO users (username, email, password_hash, avatar_url, level, total_xp) VALUES (?, ?, ?, ?, 1, 0)");
$stmt->bind_param("ssss", $username, $email, $password_hash, $avatar_url);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Test user created', 'email' => $email, 'password' => $password]);
} else {
    echo json_encode(['success' => false, 'message' => $stmt->error]);
}
$stmt->close();
$conn->close();
?>
