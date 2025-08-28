<?php
require_once 'config.php';

// Test login functionality
echo "<h2>Login Test</h2>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Test specific user
    $email = 'finance@gmail.com';
    $password = 'password123';
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if ($user) {
        echo "<p>✅ User found: {$user['name']} ({$user['email']}) - Role: {$user['role']}</p>";
        echo "<p>User ID: {$user['id']}</p>";
        echo "<p>Is Active: " . ($user['is_active'] ? 'Yes' : 'No') . "</p>";
        
        // Test password verification
        if (password_verify($password, $user['password'])) {
            echo "<p>✅ Password verification successful</p>";
            
            // Simulate successful login
            echo "<h3>Login Response:</h3>";
            $response = [
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'phone' => $user['phone'],
                    'location' => $user['location']
                ]
            ];
            echo "<pre>" . json_encode($response, JSON_PRETTY_PRINT) . "</pre>";
        } else {
            echo "<p>❌ Password verification failed</p>";
            echo "<p>Expected hash: " . $user['password'] . "</p>";
            echo "<p>Test password: $password</p>";
            
            // Test with password_hash
            $testHash = password_hash($password, PASSWORD_DEFAULT);
            echo "<p>New hash for '$password': $testHash</p>";
        }
    } else {
        echo "<p>❌ User not found with email: $email</p>";
        
        // Show all users
        echo "<h3>All users in database:</h3>";
        $stmt = $pdo->query("SELECT id, name, email, role, is_active FROM users");
        $users = $stmt->fetchAll();
        
        if (count($users) > 0) {
            echo "<table border='1' style='border-collapse: collapse;'>";
            echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Active</th></tr>";
            foreach ($users as $u) {
                echo "<tr>";
                echo "<td>{$u['id']}</td>";
                echo "<td>{$u['name']}</td>";
                echo "<td>{$u['email']}</td>";
                echo "<td>{$u['role']}</td>";
                echo "<td>" . ($u['is_active'] ? 'Yes' : 'No') . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p>❌ No users found in database</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}

// Test CORS headers
echo "<h3>CORS Headers:</h3>";
echo "<p>Access-Control-Allow-Origin: " . (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : 'Not set') . "</p>";
echo "<p>Content-Type: application/json</p>";
?>
