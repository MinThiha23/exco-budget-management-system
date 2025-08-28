<?php
require_once 'config.php';

// Debug user session and authentication
echo "<h2>Debug User Session</h2>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Check if there are any active sessions or cookies
    echo "<h3>Request Information:</h3>";
    echo "<p>Request Method: " . $_SERVER['REQUEST_METHOD'] . "</p>";
    echo "<p>Content Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'Not set') . "</p>";
    
    // Check for any POST data
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        echo "<p>Raw POST data: " . htmlspecialchars($input) . "</p>";
        
        if ($input) {
            $data = json_decode($input, true);
            echo "<p>Decoded JSON: " . json_encode($data, JSON_PRETTY_PRINT) . "</p>";
        }
    }
    
    // Check for any GET parameters
    if (!empty($_GET)) {
        echo "<p>GET parameters: " . json_encode($_GET, JSON_PRETTY_PRINT) . "</p>";
    }
    
    // Check for any cookies
    if (!empty($_COOKIE)) {
        echo "<p>Cookies: " . json_encode($_COOKIE, JSON_PRETTY_PRINT) . "</p>";
    }
    
    // Check for any headers
    $headers = getallheaders();
    if ($headers) {
        echo "<p>Headers: " . json_encode($headers, JSON_PRETTY_PRINT) . "</p>";
    }
    
    // Test with finance user
    echo "<h3>Test Finance User:</h3>";
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = 'finance@gmail.com' AND is_active = 1");
    $stmt->execute();
    $financeUser = $stmt->fetch();
    
    if ($financeUser) {
        echo "<p>✅ Finance user found:</p>";
        echo "<pre>" . json_encode($financeUser, JSON_PRETTY_PRINT) . "</pre>";
        
        // Test password
        if (password_verify('password123', $financeUser['password'])) {
            echo "<p>✅ Password verification successful</p>";
        } else {
            echo "<p>❌ Password verification failed</p>";
        }
    } else {
        echo "<p>❌ Finance user not found</p>";
    }
    
    // Show all users with their IDs
    echo "<h3>All Users (ID, Name, Email, Role):</h3>";
    $stmt = $pdo->query("SELECT id, name, email, role FROM users ORDER BY id ASC");
    $users = $stmt->fetchAll();
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr>";
    
    foreach ($users as $user) {
        echo "<tr>";
        echo "<td>{$user['id']}</td>";
        echo "<td>{$user['name']}</td>";
        echo "<td>{$user['email']}</td>";
        echo "<td>{$user['role']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>
