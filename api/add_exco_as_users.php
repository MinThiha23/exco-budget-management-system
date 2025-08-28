<?php
require_once 'config.php';

// Add EXCO users to users table as regular users
echo "<h2>Add EXCO Users to Users Table</h2>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Get all EXCO users from exco_users table
    $stmt = $pdo->query("SELECT * FROM exco_users ORDER BY id ASC");
    $excoUsers = $stmt->fetchAll();
    
    echo "<p>📊 Found " . count($excoUsers) . " EXCO users to add</p>";
    
    // Password hash for 'password123'
    $passwordHash = password_hash('password123', PASSWORD_DEFAULT);
    
    // Prepare insert statement
    $stmt = $pdo->prepare("
        INSERT INTO users (name, email, password, role, phone, location, is_active) 
        VALUES (?, ?, ?, 'user', ?, 'Kedah State Government', 1)
    ");
    
    $insertedCount = 0;
    $skippedCount = 0;
    
    foreach ($excoUsers as $excoUser) {
        // Check if user already exists with this email
        $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $checkStmt->execute([$excoUser['email']]);
        $existingUser = $checkStmt->fetch();
        
        if ($existingUser) {
            echo "<p>⚠️ Skipped: {$excoUser['name']} (email already exists)</p>";
            $skippedCount++;
        } else {
            // Insert new user
            $result = $stmt->execute([
                $excoUser['name'],
                $excoUser['email'],
                $passwordHash,
                $excoUser['phone']
            ]);
            
            if ($result) {
                $insertedCount++;
                echo "<p>✅ Added: {$excoUser['name']} ({$excoUser['email']})</p>";
            } else {
                echo "<p>❌ Failed to add: {$excoUser['name']}</p>";
            }
        }
    }
    
    echo "<h3>Summary:</h3>";
    echo "<p>✅ Successfully added: $insertedCount users</p>";
    echo "<p>⚠️ Skipped (already exists): $skippedCount users</p>";
    
    // Show all users in the system
    echo "<h3>All Users in System:</h3>";
    $stmt = $pdo->query("SELECT id, name, email, role FROM users ORDER BY id ASC");
    $allUsers = $stmt->fetchAll();
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr>";
    
    foreach ($allUsers as $user) {
        echo "<tr>";
        echo "<td>{$user['id']}</td>";
        echo "<td>{$user['name']}</td>";
        echo "<td>{$user['email']}</td>";
        echo "<td>{$user['role']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<h3>Login Credentials for EXCO Users:</h3>";
    echo "<p>All EXCO users can now login with:</p>";
    echo "<ul>";
    foreach ($excoUsers as $excoUser) {
        echo "<li><strong>{$excoUser['name']}:</strong> {$excoUser['email']} / password123</li>";
    }
    echo "</ul>";
    
    echo "<p>🎉 EXCO users have been added to the users table! They can now login to the system.</p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?> 