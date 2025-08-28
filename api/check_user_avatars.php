<?php
require_once 'config.php';

echo "<h1>Check User Avatars</h1>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Check all users and their avatars
    echo "<h2>All Users and Their Avatars</h2>";
    $stmt = $pdo->query("SELECT id, name, email, role, avatar FROM users ORDER BY id");
    $users = $stmt->fetchAll();
    
    foreach ($users as $user) {
        echo "<hr>";
        echo "<h3>{$user['name']}</h3>";
        echo "<p>Email: {$user['email']}</p>";
        echo "<p>Role: {$user['role']}</p>";
        echo "<p>Avatar: " . ($user['avatar'] ?: 'None') . "</p>";
        
        if ($user['avatar']) {
            if (strpos($user['avatar'], 'http') === 0) {
                echo "<p>🌐 Web URL: {$user['avatar']}</p>";
                // Test if the URL is accessible
                $headers = @get_headers($user['avatar']);
                if ($headers && strpos($headers[0], '200') !== false) {
                    echo "<p>✅ Web URL accessible</p>";
                    echo "<img src='{$user['avatar']}' style='width: 100px; height: 100px; object-fit: cover; border-radius: 50%;' alt='Profile Photo'>";
                } else {
                    echo "<p>❌ Web URL not accessible</p>";
                    echo "<p>Headers: " . print_r($headers, true) . "</p>";
                }
            } else {
                echo "<p>📁 Local path: {$user['avatar']}</p>";
                $fullPath = __DIR__ . '/' . $user['avatar'];
                if (file_exists($fullPath)) {
                    echo "<p>✅ Local file exists</p>";
                    echo "<img src='{$user['avatar']}' style='width: 100px; height: 100px; object-fit: cover; border-radius: 50%;' alt='Profile Photo'>";
                } else {
                    echo "<p>❌ Local file not found at: {$fullPath}</p>";
                }
            }
        }
    }
    
    // Check EXCO users specifically
    echo "<h2>EXCO Users Status</h2>";
    $stmt = $pdo->query("
        SELECT u.id, u.name, u.email, u.avatar, eu.image_url 
        FROM users u 
        LEFT JOIN exco_users eu ON u.email = eu.email 
        WHERE u.role = 'user' 
        ORDER BY u.id
    ");
    $excoUsers = $stmt->fetchAll();
    
    foreach ($excoUsers as $user) {
        echo "<hr>";
        echo "<h3>{$user['name']}</h3>";
        echo "<p>Email: {$user['email']}</p>";
        echo "<p>Avatar in users table: " . ($user['avatar'] ?: 'None') . "</p>";
        echo "<p>EXCO Image: " . ($user['image_url'] ?: 'None') . "</p>";
        
        if ($user['avatar'] && strpos($user['avatar'], 'http') === 0) {
            echo "<p>🔗 Direct link: <a href='{$user['avatar']}' target='_blank'>{$user['avatar']}</a></p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
    error_log("Check User Avatars Error: " . $e->getMessage());
}
?>
