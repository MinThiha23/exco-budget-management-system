<?php
require_once 'config.php';

echo "<h1>Profile Photo Test</h1>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Test 1: Check EXCO users with their avatars
    echo "<h2>Test 1: EXCO Users with Avatars</h2>";
    $stmt = $pdo->query("
        SELECT u.id, u.name, u.email, u.avatar, eu.image_url 
        FROM users u 
        LEFT JOIN exco_users eu ON u.email = eu.email 
        WHERE u.role = 'user' 
        ORDER BY u.id
    ");
    $users = $stmt->fetchAll();
    
    foreach ($users as $user) {
        echo "<hr>";
        echo "<h3>{$user['name']}</h3>";
        echo "<p>Email: {$user['email']}</p>";
        echo "<p>Avatar in users table: " . ($user['avatar'] ?: 'None') . "</p>";
        echo "<p>EXCO Image: " . ($user['image_url'] ?: 'None') . "</p>";
        
        if ($user['avatar']) {
            // Test if the avatar URL is accessible
            if (strpos($user['avatar'], 'http') === 0) {
                echo "<p>🌐 Testing web URL: {$user['avatar']}</p>";
                $headers = get_headers($user['avatar']);
                if ($headers && strpos($headers[0], '200') !== false) {
                    echo "<p>✅ Web URL accessible</p>";
                    echo "<img src='{$user['avatar']}' style='width: 100px; height: 100px; object-fit: cover; border-radius: 50%;' alt='Profile Photo'>";
                } else {
                    echo "<p>❌ Web URL not accessible</p>";
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
    
    // Test 2: Check if profile_photos directory exists and has files
    echo "<h2>Test 2: Profile Photos Directory</h2>";
    $profileDir = __DIR__ . '/profile_photos/';
    if (is_dir($profileDir)) {
        echo "<p>✅ Profile photos directory exists</p>";
        $files = scandir($profileDir);
        $imageFiles = array_filter($files, function($file) {
            return in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'gif']);
        });
        echo "<p>📁 Found " . count($imageFiles) . " image files:</p>";
        foreach ($imageFiles as $file) {
            echo "<p>- {$file}</p>";
        }
    } else {
        echo "<p>❌ Profile photos directory not found</p>";
    }
    
    // Test 3: Check public/images/exco directory
    echo "<h2>Test 3: Public EXCO Images</h2>";
    $publicDir = __DIR__ . '/../public/images/exco/';
    if (is_dir($publicDir)) {
        echo "<p>✅ Public EXCO images directory exists</p>";
        $files = scandir($publicDir);
        $imageFiles = array_filter($files, function($file) {
            return in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'gif']);
        });
        echo "<p>📁 Found " . count($imageFiles) . " image files:</p>";
        foreach ($imageFiles as $file) {
            echo "<p>- {$file}</p>";
        }
    } else {
        echo "<p>❌ Public EXCO images directory not found</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
    error_log("Profile Photo Test Error: " . $e->getMessage());
}
?>
