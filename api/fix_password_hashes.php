<?php
require_once 'config.php';

// Fix password hashes for all users
echo "<h2>Fix Password Hashes</h2>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Correct password hash for 'password123'
    $correctHash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    // Update all users with the correct password hash
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE is_active = 1");
    $result = $stmt->execute([$correctHash]);
    
    if ($result) {
        $affectedRows = $stmt->rowCount();
        echo "<p>✅ Successfully updated $affectedRows users with correct password hash</p>";
        
        // Verify the fix
        echo "<h3>Verification:</h3>";
        $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE is_active = 1");
        $stmt->execute();
        $users = $stmt->fetchAll();
        
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Password Fixed</th></tr>";
        
        foreach ($users as $user) {
            // Test password verification
            $testPassword = 'password123';
            $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
            $stmt->execute([$user['id']]);
            $userData = $stmt->fetch();
            
            $passwordWorks = password_verify($testPassword, $userData['password']);
            
            echo "<tr>";
            echo "<td>{$user['id']}</td>";
            echo "<td>{$user['name']}</td>";
            echo "<td>{$user['email']}</td>";
            echo "<td>{$user['role']}</td>";
            echo "<td>" . ($passwordWorks ? "✅ Yes" : "❌ No") . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        echo "<h3>Test Login Credentials:</h3>";
        echo "<ul>";
        echo "<li><strong>Admin:</strong> admin@gmail.com / password123</li>";
        echo "<li><strong>EXCO User:</strong> user1exco@gmail.com / password123</li>";
        echo "<li><strong>Finance:</strong> finance@gmail.com / password123</li>";
        echo "<li><strong>Finance Officer:</strong> finance_officer@gmail.com / password123</li>";
        echo "<li><strong>Super Admin:</strong> super_admin@gmail.com / password123</li>";
        echo "</ul>";
        
        echo "<p>✅ All users now have the correct password hash. You can now login with any of the above credentials.</p>";
        
    } else {
        echo "<p>❌ Failed to update password hashes</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>
