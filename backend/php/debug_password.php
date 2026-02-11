<?php
require_once 'config.php';

// Check users in database
echo "=== USERS IN DATABASE ===\n";
$result = $conn->query("SELECT id, username, email, password_hash FROM users LIMIT 5");
while ($row = $result->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Username: " . $row['username'] . " | Email: " . $row['email'] . "\n";
    echo "Hash: " . substr($row['password_hash'], 0, 30) . "...\n\n";
}

// Test password verify
echo "\n=== PASSWORD VERIFY TEST ===\n";
$test_password = "password";
$stmt = $conn->prepare("SELECT password_hash FROM users WHERE email = ?");
$email = "test@skillsprint.io";
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $stored_hash = $row['password_hash'];
    
    echo "Stored Hash: " . $stored_hash . "\n";
    echo "Test Password: " . $test_password . "\n";
    
    $verify_result = password_verify($test_password, $stored_hash);
    echo "password_verify() Result: " . ($verify_result ? "TRUE (PASS)" : "FALSE (FAIL)") . "\n";
    
    // Test with bcrypt cost
    $info = password_get_info($stored_hash);
    echo "Hash Algorithm: " . $info['algo'] . "\n";
    echo "Hash Cost: " . $info['options']['cost'] . "\n";
    echo "Hash Raw Length: " . strlen($stored_hash) . "\n";
} else {
    echo "No test user found!\n";
}

$conn->close();
?>
