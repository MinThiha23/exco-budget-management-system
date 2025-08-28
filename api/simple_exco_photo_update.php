<?php
require_once 'config.php';

echo "<h2>Simple EXCO Profile Photo Update</h2>";
echo "<p>This script directly updates the database to link EXCO users with their profile photos.</p>";

try {
    $pdo = getConnection();
    echo "<p>✅ Database connection successful</p>";
    
    // Get all EXCO users from exco_users table
    $stmt = $pdo->query("SELECT * FROM exco_users ORDER BY id ASC");
    $excoUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p>📊 Found " . count($excoUsers) . " EXCO users</p>";
    
    $updatedCount = 0;
    
    foreach ($excoUsers as $excoUser) {
        echo "<hr>";
        echo "<h3>Processing: {$excoUser['name']}</h3>";
        echo "<p>Email: {$excoUser['email']}</p>";
        echo "<p>Image URL: {$excoUser['image_url']}</p>";
        
        if (empty($excoUser['email'])) {
            echo "<p>⚠️ No email found, skipping...</p>";
            continue;
        }
        
        // Find the corresponding user in the users table
        $stmt = $pdo->prepare("SELECT id, name, email, avatar FROM users WHERE email = ?");
        $stmt->execute([$excoUser['email']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            echo "<p>⚠️ User not found in users table, skipping...</p>";
            continue;
        }
        
        echo "<p>Found user in users table: ID {$user['id']}</p>";
        echo "<p>Current avatar: " . ($user['avatar'] ?: 'None') . "</p>";
        
        // Convert the EXCO image path to a web-accessible URL
        $imagePath = $excoUser['image_url'];
        if (strpos($imagePath, '/images/exco/') === 0) {
            // Create a web-accessible path
            $webPath = 'https://exco.kesug.com' . $imagePath;
            
            echo "<p>🌐 Web path: {$webPath}</p>";
            
            // Update the user's avatar in the database with the web path
            $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
            $result = $stmt->execute([$webPath, $user['id']]);
            
            if ($result) {
                echo "<p>✅ Avatar updated in database with web path</p>";
                $updatedCount++;
            } else {
                echo "<p>❌ Failed to update database</p>";
            }
        } else {
            echo "<p>⚠️ Invalid image path format</p>";
        }
    }
    
    echo "<hr>";
    echo "<h3>Summary</h3>";
    echo "<p>✅ Successfully updated {$updatedCount} EXCO users' profile photos</p>";
    
    // Show final status
    echo "<h3>Final Status Check</h3>";
    $stmt = $pdo->query("SELECT u.id, u.name, u.email, u.avatar, eu.image_url 
                         FROM users u 
                         LEFT JOIN exco_users eu ON u.email = eu.email 
                         WHERE u.role = 'user' 
                         ORDER BY u.id");
    $finalUsers = $stmt->fetchAll();
    
    foreach ($finalUsers as $user) {
        echo "<p><strong>{$user['name']}</strong> ({$user['email']})</p>";
        echo "<p>  Avatar: " . ($user['avatar'] ?: 'None') . "</p>";
        echo "<p>  EXCO Image: " . ($user['image_url'] ?: 'None') . "</p>";
        echo "<br>";
    }
    
    echo "<hr>";
    echo "<h3>Next Steps</h3>";
    echo "<p>1. Check if the profile photos now appear in User Management</p>";
    echo "<p>2. If you want to use local paths instead of web URLs, run the full update script</p>";
    echo "<p>3. The photos should now be visible in both EXCO Users and User Management sections</p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
    error_log("Simple EXCO Profile Photo Update Error: " . $e->getMessage());
}
?>
