<?php
require_once 'config.php';

// Test full login flow with session
session_start();

$email = "test@skillsprint.io";
$password = "password";

// Find user
$stmt = $conn->prepare("SELECT id, username, email, password_hash, avatar_url, level, total_xp FROM users WHERE email = ? OR username = ?");
$stmt->bind_param("ss", $email, $email);
$stmt->execute();
$result = $stmt->get_result();

echo "Database Query Result:\n";
if ($result->num_rows === 0) {
    echo "ERROR: User not found\n";
} else {
    $user = $result->fetch_assoc();
    echo "✓ User found: " . $user['username'] . " (" . $user['email'] . ")\n";
    echo "Stored Hash: " . substr($user['password_hash'], 0, 30) . "...\n";
    
    // Verify password
    $pass_verify = password_verify($password, $user['password_hash']);
    echo "Password Verify: " . ($pass_verify ? "✓ TRUE" : "✗ FALSE") . "\n";
    
    if ($pass_verify) {
        // Set session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        echo "\n✓ Session set successfully!\n";
        echo "Session ID: " . session_id() . "\n";
        echo "User ID in Session: " . $_SESSION['user_id'] . "\n";
        echo "Username in Session: " . $_SESSION['username'] . "\n";
        
        unset($user['password_hash']);
        echo "\n✓ Full Response:\n";
        echo json_encode(['success' => true, 'message' => 'Login successful', 'user' => $user], JSON_PRETTY_PRINT);
    } else {
        echo "\n✗ Password verification FAILED\n";
    }
}

$conn->close();
?>
