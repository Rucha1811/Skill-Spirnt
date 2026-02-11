<?php
require_once 'config.php';

// List all users and their hashes
echo "=== ALL USERS IN DATABASE ===\n";
$result = $conn->query("SELECT id, username, email FROM users");
echo "Total Users: " . $result->num_rows . "\n\n";

while ($row = $result->fetch_assoc()) {
    echo "✓ ID: " . $row['id'] . " | Username: " . $row['username'] . " | Email: " . $row['email'] . "\n";
}

echo "\n=== TEST CREDENTIALS ===\n";
echo "Email: test@skillsprint.io\n";
echo "Password: password\n";

echo "\n=== OTHER EXISTING USERS ===\n";
echo "Email: ruchagandhi12@gmail.com\n";
echo "Username: rucha\n";
echo "Email: zeel06@gmail.com\n";
echo "Username: zeel\n";
echo "Email: yatrijoshi13@gmail.com\n";
echo "Username: yatri\n";

echo "\n\n=== HOW TO LOGIN ===\n";
echo "1. Go to http://localhost/p2/skillsprint/frontend/auth.html\n";
echo "2. Click the purple portal 3 times\n";
echo "3. Click LOGIN tab (or leave on LOGIN)\n";
echo "4. Enter Email: test@skillsprint.io\n";
echo "5. Enter Password: password\n";
echo "6. Click ENTER SYSTEM\n";

$conn->close();
?>
