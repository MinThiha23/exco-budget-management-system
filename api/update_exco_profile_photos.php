<?php
require_once 'config.php';

echo "<h2>Update EXCO Users Profile Photos</h2>";

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
        
        // Convert the image_url to the correct path for profile_photos
        $imagePath = $excoUser['image_url'];
        if (strpos($imagePath, '/images/exco/') === 0) {
            // Convert to profile_photos path
            $filename = basename($imagePath);
            $newPath = 'profile_photos/' . $filename;
            
            // Try multiple possible source paths for InfinityFree
            $possibleSourcePaths = [
                // Path relative to htdocs root
                __DIR__ . '/../public' . $imagePath,
                // Path relative to current directory
                __DIR__ . '/../public' . $imagePath,
                // Direct path from htdocs
                '/home/vol15_1/infinityfree.com/if0_39600694/htdocs/public' . $imagePath,
                // Alternative path structure
                __DIR__ . '/../../public' . $imagePath
            ];
            
            $sourcePath = null;
            foreach ($possibleSourcePaths as $path) {
                echo "<p>🔍 Checking path: {$path}</p>";
                if (file_exists($path)) {
                    $sourcePath = $path;
                    echo "<p>✅ Found image at: {$path}</p>";
                    break;
                }
            }
            
            if ($sourcePath) {
                // Create profile_photos directory if it doesn't exist
                $uploadDir = __DIR__ . '/profile_photos/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                    echo "<p>📁 Created profile_photos directory</p>";
                }
                
                // Copy the file
                if (copy($sourcePath, $uploadDir . $filename)) {
                    echo "<p>✅ Image copied to: {$newPath}</p>";
                    
                    // Update the user's avatar in the database
                    $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
                    $result = $stmt->execute([$newPath, $user['id']]);
                    
                    if ($result) {
                        echo "<p>✅ Avatar updated in database</p>";
                        $updatedCount++;
                    } else {
                        echo "<p>❌ Failed to update database</p>";
                    }
                } else {
                    echo "<p>❌ Failed to copy image file</p>";
                }
            } else {
                echo "<p>⚠️ Image not found in any of the expected locations</p>";
                echo "<p>💡 Alternative: Let's try to directly update the database with the EXCO image path</p>";
                
                // Try to directly use the EXCO image path as the avatar
                $directPath = $imagePath; // Use the original path like '/images/exco/chief-minister.jpg'
                
                $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
                $result = $stmt->execute([$directPath, $user['id']]);
                
                if ($result) {
                    echo "<p>✅ Avatar updated in database with direct path: {$directPath}</p>";
                    $updatedCount++;
                } else {
                    echo "<p>❌ Failed to update database with direct path</p>";
                }
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
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
    error_log("EXCO Profile Photo Update Error: " . $e->getMessage());
}
?>
