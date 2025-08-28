<?php
require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Profile Synchronization Test</h2>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Test 1: Check if users table has the updated photo
    echo "<h3>1. Users Table Check</h3>";
    $stmt = $pdo->prepare("SELECT id, name, email, avatar FROM users WHERE email = 'haimhilman@kedah.gov.my'");
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "<p>✅ User found in users table:</p>";
        echo "<ul>";
        echo "<li>ID: " . $user['id'] . "</li>";
        echo "<li>Name: " . $user['name'] . "</li>";
        echo "<li>Email: " . $user['email'] . "</li>";
        echo "<li>Avatar: " . ($user['avatar'] ? $user['avatar'] : 'Not set') . "</li>";
        echo "</ul>";
    } else {
        echo "<p>❌ User not found in users table</p>";
    }
    
    // Test 2: Check if exco_users table exists and has data
    echo "<h3>2. EXCO Users Table Check</h3>";
    $stmt = $pdo->query("SHOW TABLES LIKE 'exco_users'");
    if ($stmt->fetch()) {
        echo "<p>✅ exco_users table exists</p>";
        
        // Check if the specific user exists in exco_users
        $stmt = $pdo->prepare("SELECT * FROM exco_users WHERE email = 'haimhilman@kedah.gov.my'");
        $stmt->execute();
        $excoUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($excoUser) {
            echo "<p>✅ User found in exco_users table:</p>";
            echo "<ul>";
            echo "<li>ID: " . $excoUser['id'] . "</li>";
            echo "<li>Name: " . $excoUser['name'] . "</li>";
            echo "<li>Email: " . $excoUser['email'] . "</li>";
            echo "<li>Phone: " . ($excoUser['phone'] ? $excoUser['phone'] : 'Not set') . "</li>";
            echo "<li>Image URL: " . ($excoUser['image_url'] ? $excoUser['image_url'] : 'Not set') . "</li>";
            echo "</ul>";
        } else {
            echo "<p>❌ User not found in exco_users table</p>";
            
            // Show all exco_users for debugging
            echo "<p>📊 All EXCO users in database:</p>";
            $stmt = $pdo->query("SELECT id, name, email FROM exco_users");
            $allExcoUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo "<ol>";
            foreach ($allExcoUsers as $excoUser) {
                echo "<li>{$excoUser['name']} ({$excoUser['email']})</li>";
            }
            echo "</ol>";
        }
    } else {
        echo "<p>❌ exco_users table does not exist</p>";
    }
    
    // Test 3: Test the API endpoints
    echo "<h3>3. API Endpoint Test</h3>";
    
    // Test EXCO Users GET endpoint
    $apiUrl = 'https://exco.kesug.com/api/exco_users.php';
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Content-Type: application/json'
        ]
    ]);
    
    $response = file_get_contents($apiUrl, false, $context);
    if ($response) {
        $data = json_decode($response, true);
        if ($data && $data['success']) {
            echo "<p>✅ EXCO Users API working: " . count($data['excoUsers']) . " users found</p>";
            
            // Check if our specific user is in the API response
            $found = false;
            foreach ($data['excoUsers'] as $user) {
                if ($user['email'] === 'haimhilman@kedah.gov.my') {
                    $found = true;
                    echo "<p>✅ Target user found in API response:</p>";
                    echo "<ul>";
                    echo "<li>Name: " . $user['name'] . "</li>";
                    echo "<li>Phone: " . ($user['phone'] ? $user['phone'] : 'Not set') . "</li>";
                    echo "<li>Image URL: " . ($user['image_url'] ? $user['image_url'] : 'Not set') . "</li>";
                    echo "</ul>";
                    break;
                }
            }
            
            if (!$found) {
                echo "<p>❌ Target user NOT found in API response</p>";
            }
        } else {
            echo "<p>❌ EXCO Users API error: " . ($data['error'] ?? 'Unknown error') . "</p>";
        }
    } else {
        echo "<p>❌ Could not reach EXCO Users API</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>
