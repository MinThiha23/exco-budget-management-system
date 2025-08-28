<?php
require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>🔍 Profile Photos Directory Check</h2>";
echo "<style>
body { font-family: Arial, sans-serif; margin: 20px; }
.success { color: green; }
.error { color: red; }
.warning { color: orange; }
.info { color: blue; }
table { border-collapse: collapse; width: 100%; margin: 20px 0; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
th { background-color: #f2f2f2; }
</style>";

try {
    $pdo = getConnection();
    echo "<p class='success'>✅ Database connection successful</p>";
    
    // Check what's in the profile_photos directory
    echo "<h3>📁 Server File System Check</h3>";
    
    $profileDir = __DIR__ . '/profile_photos/';
    if (is_dir($profileDir)) {
        echo "<p class='success'>✅ Profile photos directory exists: $profileDir</p>";
        
        $files = scandir($profileDir);
        $imageFiles = array_filter($files, function($file) {
            return !in_array($file, ['.', '..']) && 
                   (strpos(strtolower($file), '.jpg') !== false || 
                    strpos(strtolower($file), '.jpeg') !== false || 
                    strpos(strtolower($file), '.png') !== false ||
                    strpos(strtolower($file), '.gif') !== false);
        });
        
        if (empty($imageFiles)) {
            echo "<p class='error'>❌ No image files found in profile_photos directory</p>";
        } else {
            echo "<p class='success'>✅ Found " . count($imageFiles) . " image files:</p>";
            echo "<table>";
            echo "<tr><th>Filename</th><th>Size</th><th>Last Modified</th><th>Status</th></tr>";
            
            foreach ($imageFiles as $file) {
                $fullPath = $profileDir . $file;
                $fileSize = filesize($fullPath);
                $lastModified = date('Y-m-d H:i:s', filemtime($fullPath));
                $relativePath = 'profile_photos/' . $file;
                
                echo "<tr>";
                echo "<td><code>$file</code></td>";
                echo "<td>" . number_format($fileSize) . " bytes</td>";
                echo "<td>$lastModified</td>";
                echo "<td class='success'>✅ Exists</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    } else {
        echo "<p class='error'>❌ Profile photos directory not found: $profileDir</p>";
    }
    
    // Check what's in the database
    echo "<h3>🗄️ Database Image Paths Check</h3>";
    
    $stmt = $pdo->prepare("SELECT id, name, email, avatar FROM users WHERE avatar IS NOT NULL AND avatar != ''");
    $stmt->execute();
    $usersWithAvatars = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($usersWithAvatars)) {
        echo "<p class='warning'>⚠️ No users with avatar paths in database</p>";
    } else {
        echo "<p class='success'>✅ Found " . count($usersWithAvatars) . " users with avatar paths:</p>";
        echo "<table>";
        echo "<tr><th>User</th><th>Email</th><th>Avatar Path</th><th>File Exists</th><th>Status</th></tr>";
        
        foreach ($usersWithAvatars as $user) {
            $avatarPath = $user['avatar'];
            $fullPath = __DIR__ . '/' . $avatarPath;
            $fileExists = file_exists($fullPath);
            
            echo "<tr>";
            echo "<td>" . $user['name'] . "</td>";
            echo "<td>" . $user['email'] . "</td>";
            echo "<td><code>$avatarPath</code></td>";
            echo "<td>" . ($fileExists ? 'Yes' : 'No') . "</td>";
            echo "<td class='" . ($fileExists ? 'success' : 'error') . "'>" . ($fileExists ? '✅' : '❌') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    // Check EXCO users table
    echo "<h3>👥 EXCO Users Image Paths Check</h3>";
    
    $stmt = $pdo->prepare("SELECT id, name, email, image_url FROM exco_users WHERE image_url IS NOT NULL AND image_url != ''");
    $stmt->execute();
    $excoUsersWithImages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($excoUsersWithImages)) {
        echo "<p class='warning'>⚠️ No EXCO users with image paths in database</p>";
    } else {
        echo "<p class='success'>✅ Found " . count($excoUsersWithImages) . " EXCO users with image paths:</p>";
        echo "<table>";
        echo "<tr><th>User</th><th>Email</th><th>Image Path</th><th>File Exists</th><th>Status</th></tr>";
        
        foreach ($excoUsersWithImages as $user) {
            $imagePath = $user['image_url'];
            $fullPath = __DIR__ . '/' . $imagePath;
            $fileExists = file_exists($fullPath);
            
            echo "<tr>";
            echo "<td>" . $user['name'] . "</td>";
            echo "<td>" . $user['email'] . "</td>";
            echo "<td><code>$imagePath</code></td>";
            echo "<td>" . ($fileExists ? 'Yes' : 'No') . "</td>";
            echo "<td class='" . ($fileExists ? 'success' : 'error') . "'>" . ($fileExists ? '✅' : '❌') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    // Test specific user
    echo "<h3>🎯 Specific User Check: Haim Hilman</h3>";
    
    $userEmail = 'haimhilman@kedah.gov.my';
    
    // Check users table
    $stmt = $pdo->prepare("SELECT avatar FROM users WHERE email = ?");
    $stmt->execute([$userEmail]);
    $userAvatar = $stmt->fetchColumn();
    
    // Check exco_users table
    $stmt = $pdo->prepare("SELECT image_url FROM exco_users WHERE email = ?");
    $stmt->execute([$userEmail]);
    $excoImageUrl = $stmt->fetchColumn();
    
    echo "<table>";
    echo "<tr><th>Table</th><th>Image Path</th><th>File Exists</th><th>Status</th></tr>";
    
    if ($userAvatar) {
        $fullPath = __DIR__ . '/' . $userAvatar;
        $fileExists = file_exists($fullPath);
        echo "<tr>";
        echo "<td>users.avatar</td>";
        echo "<td><code>$userAvatar</code></td>";
        echo "<td>" . ($fileExists ? 'Yes' : 'No') . "</td>";
        echo "<td class='" . ($fileExists ? 'success' : 'error') . "'>" . ($fileExists ? '✅' : '❌') . "</td>";
        echo "</tr>";
    }
    
    if ($excoImageUrl) {
        $fullPath = __DIR__ . '/' . $excoImageUrl;
        $fileExists = file_exists($fullPath);
        echo "<tr>";
        echo "<td>exco_users.image_url</td>";
        echo "<td><code>$excoImageUrl</code></td>";
        echo "<td>" . ($fileExists ? 'Yes' : 'No') . "</td>";
        echo "<td class='" . ($fileExists ? 'success' : 'error') . "'>" . ($fileExists ? '✅' : '❌') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Test URL accessibility
    echo "<h3>🌐 URL Accessibility Test</h3>";
    
    if ($userAvatar) {
        $testUrl = 'https://exco.kesug.com/api/' . $userAvatar;
        echo "<p>Testing URL: <a href='$testUrl' target='_blank'>$testUrl</a></p>";
        
        $context = stream_context_create([
            'http' => [
                'method' => 'HEAD',
                'timeout' => 10
            ]
        ]);
        
        $headers = @get_headers($testUrl, 1, $context);
        if ($headers) {
            $statusCode = $headers[0];
            echo "<p class='" . (strpos($statusCode, '200') !== false ? 'success' : 'error') . "'>Status: $statusCode</p>";
        } else {
            echo "<p class='error'>❌ Could not access URL</p>";
        }
    }
    
    echo "<h3>💡 Recommendations</h3>";
    echo "<ol>";
    echo "<li><strong>Check file permissions:</strong> Ensure profile_photos directory is readable by web server</li>";
    echo "<li><strong>Check .htaccess:</strong> Ensure no rewrite rules are blocking image access</li>";
    echo "<li><strong>Check file ownership:</strong> Ensure web server can read the image files</li>";
    echo "<li><strong>Check file paths:</strong> Ensure database paths match actual file locations</li>";
    echo "</ol>";
    
} catch (Exception $e) {
    echo "<p class='error'>❌ Error: " . $e->getMessage() . "</p>";
}
?>
