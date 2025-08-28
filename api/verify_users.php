<?php
require_once 'config.php';

// Verify users in database
echo "<h2>Verify Users in Database</h2>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Get total count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    $totalCount = $result['count'];
    
    echo "<p>📊 Total users in database: $totalCount</p>";
    
    // Get all users
    $stmt = $pdo->query("SELECT id, name, email, role, phone, location FROM users ORDER BY id ASC");
    $users = $stmt->fetchAll();
    
    echo "<h3>All Users in Database:</h3>";
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Location</th></tr>";
    
    foreach ($users as $user) {
        echo "<tr>";
        echo "<td>{$user['id']}</td>";
        echo "<td>{$user['name']}</td>";
        echo "<td>{$user['email']}</td>";
        echo "<td>{$user['role']}</td>";
        echo "<td>{$user['phone']}</td>";
        echo "<td>{$user['location']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Check for EXCO users specifically
    echo "<h3>EXCO Users (with @kedah.gov.my emails):</h3>";
    $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE email LIKE '%@kedah.gov.my' OR email = 'halimatonsaadiah@kedah.gov' ORDER BY id ASC");
    $stmt->execute();
    $excoUsers = $stmt->fetchAll();
    
    if (count($excoUsers) > 0) {
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr>";
        
        foreach ($excoUsers as $user) {
            echo "<tr>";
            echo "<td>{$user['id']}</td>";
            echo "<td>{$user['name']}</td>";
            echo "<td>{$user['email']}</td>";
            echo "<td>{$user['role']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        echo "<p>✅ Found " . count($excoUsers) . " EXCO users in database</p>";
    } else {
        echo "<p>❌ No EXCO users found in database</p>";
    }
    
    // Check for users with role 'user'
    echo "<h3>Users with Role 'user':</h3>";
    $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE role = 'user' ORDER BY id ASC");
    $stmt->execute();
    $userRoleUsers = $stmt->fetchAll();
    
    if (count($userRoleUsers) > 0) {
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr>";
        
        foreach ($userRoleUsers as $user) {
            echo "<tr>";
            echo "<td>{$user['id']}</td>";
            echo "<td>{$user['name']}</td>";
            echo "<td>{$user['email']}</td>";
            echo "<td>{$user['role']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        echo "<p>✅ Found " . count($userRoleUsers) . " users with role 'user'</p>";
    } else {
        echo "<p>❌ No users with role 'user' found</p>";
    }
    
    // Test login for one EXCO user
    echo "<h3>Test Login for EXCO User:</h3>";
    $testEmail = 'pmb@kedah.gov.my';
    $testPassword = 'password123';
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$testEmail]);
    $user = $stmt->fetch();
    
    if ($user) {
        echo "<p>✅ User found: {$user['name']} ({$user['email']})</p>";
        echo "<p>Role: {$user['role']}</p>";
        
        if (password_verify($testPassword, $user['password'])) {
            echo "<p>✅ Password verification successful</p>";
        } else {
            echo "<p>❌ Password verification failed</p>";
        }
    } else {
        echo "<p>❌ User not found with email: $testEmail</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>
