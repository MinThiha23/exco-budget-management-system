<?php
require_once 'config.php';

// Test the auth endpoint directly
echo "<h2>Auth Endpoint Test</h2>";

// Simulate a POST request to auth.php
$_SERVER['REQUEST_METHOD'] = 'POST';
$input = [
    'action' => 'login',
    'email' => 'finance@gmail.com',
    'password' => 'password123'
];

// Store the original input
$originalInput = file_get_contents('php://input');

// Simulate the input
file_put_contents('php://input', json_encode($input));

try {
    // Test database connection first
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Test user lookup
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$input['email']]);
    $user = $stmt->fetch();
    
    if ($user) {
        echo "<p>✅ User found: {$user['name']} ({$user['email']}) - Role: {$user['role']}</p>";
        echo "<p>User ID: {$user['id']}</p>";
        echo "<p>Is Active: " . ($user['is_active'] ? 'Yes' : 'No') . "</p>";
        
        // Test password verification
        if (password_verify($input['password'], $user['password'])) {
            echo "<p>✅ Password verification successful</p>";
            
            // Simulate successful login response
            unset($user['password']);
            $response = [
                'success' => true,
                'message' => 'Login successful',
                'user' => $user
            ];
            
            echo "<h3>Expected Login Response:</h3>";
            echo "<pre>" . json_encode($response, JSON_PRETTY_PRINT) . "</pre>";
            
        } else {
            echo "<p>❌ Password verification failed</p>";
            echo "<p>Stored hash: " . $user['password'] . "</p>";
            echo "<p>Test password: " . $input['password'] . "</p>";
            
            // Generate new hash
            $newHash = password_hash($input['password'], PASSWORD_DEFAULT);
            echo "<p>New hash: " . $newHash . "</p>";
            
            // Update the user's password
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            $result = $stmt->execute([$newHash, $user['id']]);
            
            if ($result) {
                echo "<p>✅ Updated user password with new hash</p>";
                
                // Test again
                if (password_verify($input['password'], $newHash)) {
                    echo "<p>✅ Password verification now successful after update</p>";
                } else {
                    echo "<p>❌ Password verification still failed after update</p>";
                }
            } else {
                echo "<p>❌ Failed to update user password</p>";
            }
        }
    } else {
        echo "<p>❌ User not found with email: {$input['email']}</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}

// Restore original input
file_put_contents('php://input', $originalInput);
?>
