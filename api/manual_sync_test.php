<?php
require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Manual Profile Synchronization Test</h2>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    $userEmail = 'haimhilman@kedah.gov.my';
    
    // Step 1: Get current user data from users table
    echo "<h3>Step 1: Get User Data</h3>";
    $stmt = $pdo->prepare("SELECT id, name, email, phone, avatar FROM users WHERE email = ?");
    $stmt->execute([$userEmail]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo "<p>❌ User not found in users table</p>";
        exit;
    }
    
    echo "<p>✅ User found:</p>";
    echo "<ul>";
    echo "<li>Name: " . $user['name'] . "</li>";
    echo "<li>Email: " . $user['email'] . "</li>";
    echo "<li>Phone: " . ($user['phone'] ? $user['phone'] : 'Not set') . "</li>";
    echo "<li>Avatar: " . ($user['avatar'] ? $user['avatar'] : 'Not set') . "</li>";
    echo "</ul>";
    
    // Step 2: Check if user exists in exco_users table
    echo "<h3>Step 2: Check EXCO Users Table</h3>";
    $stmt = $pdo->prepare("SELECT * FROM exco_users WHERE email = ?");
    $stmt->execute([$userEmail]);
    $excoUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($excoUser) {
        echo "<p>✅ User found in exco_users table</p>";
        
        // Step 3: Sync the data
        echo "<h3>Step 3: Sync Profile Data</h3>";
        
        $updates = [];
        $params = [];
        
        // Update phone if different
        if ($user['phone'] && $user['phone'] !== $excoUser['phone']) {
            $updates[] = "phone = ?";
            $params[] = $user['phone'];
            echo "<p>📱 Will update phone: {$excoUser['phone']} → {$user['phone']}</p>";
        }
        
        // Update image_url if different
        if ($user['avatar'] && $user['avatar'] !== $excoUser['image_url']) {
            $updates[] = "image_url = ?";
            $params[] = $user['avatar'];
            echo "<p>🖼️ Will update image: {$excoUser['image_url']} → {$user['avatar']}</p>";
        }
        
        if (!empty($updates)) {
            $params[] = $userEmail; // for WHERE clause
            
            $sql = "UPDATE exco_users SET " . implode(', ', $updates) . " WHERE email = ?";
            echo "<p>🔄 SQL: " . $sql . "</p>";
            
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result && $stmt->rowCount() > 0) {
                echo "<p>✅ Profile synced successfully! Updated " . $stmt->rowCount() . " row(s)</p>";
                
                // Verify the update
                $stmt = $pdo->prepare("SELECT phone, image_url FROM exco_users WHERE email = ?");
                $stmt->execute([$userEmail]);
                $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo "<p>✅ Updated EXCO user data:</p>";
                echo "<ul>";
                echo "<li>Phone: " . ($updatedUser['phone'] ? $updatedUser['phone'] : 'Not set') . "</li>";
                echo "<li>Image URL: " . ($updatedUser['image_url'] ? $updatedUser['image_url'] : 'Not set') . "</li>";
                echo "</ul>";
            } else {
                echo "<p>❌ Failed to sync profile data</p>";
            }
        } else {
            echo "<p>ℹ️ No updates needed - data is already in sync</p>";
        }
        
    } else {
        echo "<p>❌ User not found in exco_users table</p>";
        echo "<p>💡 This might be why the synchronization isn't working!</p>";
        
        // Try to add the user to exco_users table
        echo "<h3>Step 3: Add User to EXCO Users Table</h3>";
        
        $stmt = $pdo->prepare("
            INSERT INTO exco_users (name, title, role, email, phone, image_url, department, position) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $user['name'],
            'Member of the Kedah State Government Council', // default title
            'EXCO Member', // default role
            $user['email'],
            $user['phone'],
            $user['avatar'],
            'Kedah State Government', // default department
            'EXCO Member' // default position
        ]);
        
        if ($result) {
            echo "<p>✅ User added to exco_users table successfully!</p>";
        } else {
            echo "<p>❌ Failed to add user to exco_users table</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>
