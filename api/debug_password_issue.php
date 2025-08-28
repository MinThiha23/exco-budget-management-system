<?php
require_once 'config.php';

// Debug password hash issue
echo "<h2>Password Hash Debug</h2>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Check current password hashes
    echo "<h3>Current Password Hashes in Database:</h3>";
    $stmt = $pdo->query("SELECT id, name, email, password FROM users WHERE is_active = 1");
    $users = $stmt->fetchAll();
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Password Hash</th><th>Length</th></tr>";
    
    foreach ($users as $user) {
        echo "<tr>";
        echo "<td>{$user['id']}</td>";
        echo "<td>{$user['name']}</td>";
        echo "<td>{$user['email']}</td>";
        echo "<td style='font-family: monospace; font-size: 10px;'>{$user['password']}</td>";
        echo "<td>" . strlen($user['password']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Test password verification for each user
    echo "<h3>Password Verification Test:</h3>";
    $testPassword = 'password123';
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Email</th><th>Current Hash Works</th><th>New Hash</th><th>New Hash Works</th></tr>";
    
    foreach ($users as $user) {
        $currentHashWorks = password_verify($testPassword, $user['password']);
        $newHash = password_hash($testPassword, PASSWORD_DEFAULT);
        $newHashWorks = password_verify($testPassword, $newHash);
        
        echo "<tr>";
        echo "<td>{$user['id']}</td>";
        echo "<td>{$user['email']}</td>";
        echo "<td>" . ($currentHashWorks ? "✅ Yes" : "❌ No") . "</td>";
        echo "<td style='font-family: monospace; font-size: 10px;'>" . substr($newHash, 0, 50) . "...</td>";
        echo "<td>" . ($newHashWorks ? "✅ Yes" : "❌ No") . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Force update all passwords with new hashes
    echo "<h3>Force Password Update:</h3>";
    
    $updateCount = 0;
    foreach ($users as $user) {
        $newHash = password_hash($testPassword, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $result = $stmt->execute([$newHash, $user['id']]);
        
        if ($result) {
            $updateCount++;
            echo "<p>✅ Updated user {$user['email']} with new password hash</p>";
        } else {
            echo "<p>❌ Failed to update user {$user['email']}</p>";
        }
    }
    
    echo "<p><strong>Total users updated: $updateCount</strong></p>";
    
    // Verify the fix
    echo "<h3>Final Verification:</h3>";
    $stmt = $pdo->query("SELECT id, name, email FROM users WHERE is_active = 1");
    $updatedUsers = $stmt->fetchAll();
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Password Works</th></tr>";
    
    foreach ($updatedUsers as $user) {
        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $userData = $stmt->fetch();
        
        $passwordWorks = password_verify($testPassword, $userData['password']);
        
        echo "<tr>";
        echo "<td>{$user['id']}</td>";
        echo "<td>{$user['name']}</td>";
        echo "<td>{$user['email']}</td>";
        echo "<td>" . ($passwordWorks ? "✅ Yes" : "❌ No") . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<h3>Login Credentials (All passwords: password123):</h3>";
    echo "<ul>";
    foreach ($updatedUsers as $user) {
        echo "<li><strong>{$user['name']}:</strong> {$user['email']} / password123</li>";
    }
    echo "</ul>";
    
    echo "<p>✅ All users have been updated with fresh password hashes. Try logging in now!</p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>
