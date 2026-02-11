<?php
require_once 'config.php';

// First, let's check existing users' password hashes
echo "=== CHECKING EXISTING USERS ===\n\n";

// Delete old test user if exists
$conn->query("DELETE FROM users WHERE email = 'test@skillsprint.io'");
echo "✓ Cleaned old test user\n\n";

// Create fresh test user with GUARANTEED working password
$test_username = 'skillsprinter';
$test_email = 'demo@skillsprint.io';
$test_password = '12345678'; // Simple password for testing

$password_hash = password_hash($test_password, PASSWORD_BCRYPT, ['cost' => 10]);
$avatar_url = "https://api.dicebear.com/7.x/avataaars/svg?seed=" . urlencode($test_username);

echo "Creating test user:\n";
echo "  Username: $test_username\n";
echo "  Email: $test_email\n";
echo "  Password: $test_password\n";
echo "  Hash: $password_hash\n\n";

$stmt = $conn->prepare("INSERT INTO users (username, email, password_hash, avatar_url, level, total_xp) VALUES (?, ?, ?, ?, 1, 0)");
$stmt->bind_param("ssss", $test_username, $test_email, $password_hash, $avatar_url);

if ($stmt->execute()) {
    echo "✓ User created successfully!\n\n";
    
    // Verify it works
    echo "=== VERIFICATION TEST ===\n";
    $stmt2 = $conn->prepare("SELECT password_hash FROM users WHERE email = ?");
    $stmt2->bind_param("s", $test_email);
    $stmt2->execute();
    $result = $stmt2->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $verify = password_verify($test_password, $row['password_hash']);
        echo "Password Verification: " . ($verify ? "✓ PASS" : "✗ FAIL") . "\n";
    }
} else {
    echo "✗ Error creating user: " . $stmt->error . "\n";
}

echo "\n=== LOGIN CREDENTIALS ===\n";
echo "Email: $test_email\n";
echo "Password: $test_password\n";

$conn->close();
?>
