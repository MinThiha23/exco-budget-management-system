<?php
require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>🔍 Profile Synchronization Debug Report</h2>";
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
    
    $userEmail = 'haimhilman@kedah.gov.my';
    
    // Check current status in both tables
    echo "<h3>📊 Current Data Status</h3>";
    
    // Users table
    echo "<h4>Users Table</h4>";
    $stmt = $pdo->prepare("SELECT id, name, email, phone, avatar, updated_at FROM users WHERE email = ?");
    $stmt->execute([$userEmail]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "<table>";
        echo "<tr><th>Field</th><th>Value</th><th>Status</th></tr>";
        echo "<tr><td>ID</td><td>" . $user['id'] . "</td><td class='success'>✅</td></tr>";
        echo "<tr><td>Name</td><td>" . $user['name'] . "</td><td class='success'>✅</td></tr>";
        echo "<tr><td>Email</td><td>" . $user['email'] . "</td><td class='success'>✅</td></tr>";
        echo "<tr><td>Phone</td><td>" . ($user['phone'] ?: 'Not set') . "</td><td class='" . ($user['phone'] ? 'success' : 'warning') . "'>" . ($user['phone'] ? '✅' : '⚠️') . "</td></tr>";
        echo "<tr><td>Avatar</td><td>" . ($user['avatar'] ?: 'Not set') . "</td><td class='" . ($user['avatar'] ? 'success' : 'warning') . "'>" . ($user['avatar'] ? '✅' : '⚠️') . "</td></tr>";
        echo "<tr><td>Updated</td><td>" . ($user['updated_at'] ?: 'Not set') . "</td><td class='info'>ℹ️</td></tr>";
        echo "</table>";
    } else {
        echo "<p class='error'>❌ User not found in users table</p>";
    }
    
    // EXCO Users table
    echo "<h4>EXCO Users Table</h4>";
    $stmt = $pdo->prepare("SELECT id, name, email, phone, image_url FROM exco_users WHERE email = ?");
    $stmt->execute([$userEmail]);
    $excoUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($excoUser) {
        echo "<table>";
        echo "<tr><th>Field</th><th>Value</th><th>Status</th><th>Sync Status</th></tr>";
        echo "<tr><td>ID</td><td>" . $excoUser['id'] . "</td><td class='success'>✅</td><td>-</td></tr>";
        echo "<tr><td>Name</td><td>" . $excoUser['name'] . "</td><td class='success'>✅</td><td>" . ($user && $user['name'] === $excoUser['name'] ? "<span class='success'>✅ Synced</span>" : "<span class='error'>❌ Not synced</span>") . "</td></tr>";
        echo "<tr><td>Email</td><td>" . $excoUser['email'] . "</td><td class='success'>✅</td><td>-</td></tr>";
        echo "<tr><td>Phone</td><td>" . ($excoUser['phone'] ?: 'Not set') . "</td><td class='" . ($excoUser['phone'] ? 'success' : 'warning') . "'>" . ($excoUser['phone'] ? '✅' : '⚠️') . "</td><td>" . ($user && $user['phone'] === $excoUser['phone'] ? "<span class='success'>✅ Synced</span>" : "<span class='error'>❌ Not synced</span>") . "</td></tr>";
        echo "<tr><td>Image URL</td><td>" . ($excoUser['image_url'] ?: 'Not set') . "</td><td class='" . ($excoUser['image_url'] ? 'success' : 'warning') . "'>" . ($excoUser['image_url'] ? '✅' : '⚠️') . "</td><td>" . ($user && $user['avatar'] === $excoUser['image_url'] ? "<span class='success'>✅ Synced</span>" : "<span class='error'>❌ Not synced</span>") . "</td></tr>";
        echo "</table>";
    } else {
        echo "<p class='error'>❌ User not found in exco_users table</p>";
    }
    
    // Compare data
    echo "<h3>🔄 Synchronization Analysis</h3>";
    if ($user && $excoUser) {
        $syncIssues = [];
        
        if ($user['phone'] !== $excoUser['phone']) {
            $syncIssues[] = "Phone: Users({$user['phone']}) vs EXCO({$excoUser['phone']})";
        }
        
        if ($user['avatar'] !== $excoUser['image_url']) {
            $syncIssues[] = "Image: Users({$user['avatar']}) vs EXCO({$excoUser['image_url']})";
        }
        
        if (empty($syncIssues)) {
            echo "<p class='success'>✅ All data is perfectly synchronized!</p>";
        } else {
            echo "<p class='error'>❌ Synchronization issues found:</p>";
            echo "<ul>";
            foreach ($syncIssues as $issue) {
                echo "<li class='error'>$issue</li>";
            }
            echo "</ul>";
            
            // Auto-fix sync issues
            echo "<h4>🔧 Auto-Fix Attempt</h4>";
            
            if ($user['phone'] !== $excoUser['phone'] && $user['phone']) {
                $stmt = $pdo->prepare("UPDATE exco_users SET phone = ? WHERE email = ?");
                $result = $stmt->execute([$user['phone'], $userEmail]);
                echo "<p class='" . ($result ? 'success' : 'error') . "'>" . ($result ? '✅' : '❌') . " Phone sync: " . ($result ? 'Fixed' : 'Failed') . "</p>";
            }
            
            if ($user['avatar'] !== $excoUser['image_url'] && $user['avatar']) {
                $stmt = $pdo->prepare("UPDATE exco_users SET image_url = ? WHERE email = ?");
                $result = $stmt->execute([$user['avatar'], $userEmail]);
                echo "<p class='" . ($result ? 'success' : 'error') . "'>" . ($result ? '✅' : '❌') . " Image sync: " . ($result ? 'Fixed' : 'Failed') . "</p>";
            }
        }
    }
    
    // Test API endpoint
    echo "<h3>🌐 API Test</h3>";
    $apiUrl = 'https://exco.kesug.com/api/exco_users.php';
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Content-Type: application/json',
            'timeout' => 10
        ]
    ]);
    
    $response = @file_get_contents($apiUrl, false, $context);
    if ($response) {
        $data = json_decode($response, true);
        if ($data && $data['success']) {
            echo "<p class='success'>✅ API is working: " . count($data['excoUsers']) . " users returned</p>";
            
            // Find our user in API response
            $apiUser = null;
            foreach ($data['excoUsers'] as $apiUserData) {
                if ($apiUserData['email'] === $userEmail) {
                    $apiUser = $apiUserData;
                    break;
                }
            }
            
            if ($apiUser) {
                echo "<h4>API Response for User:</h4>";
                echo "<table>";
                echo "<tr><th>Field</th><th>API Value</th><th>Database Value</th><th>Match</th></tr>";
                echo "<tr><td>Phone</td><td>" . ($apiUser['phone'] ?: 'Not set') . "</td><td>" . ($excoUser['phone'] ?: 'Not set') . "</td><td class='" . ($apiUser['phone'] === $excoUser['phone'] ? 'success' : 'error') . "'>" . ($apiUser['phone'] === $excoUser['phone'] ? '✅' : '❌') . "</td></tr>";
                echo "<tr><td>Image URL</td><td>" . ($apiUser['image_url'] ?: 'Not set') . "</td><td>" . ($excoUser['image_url'] ?: 'Not set') . "</td><td class='" . ($apiUser['image_url'] === $excoUser['image_url'] ? 'success' : 'error') . "'>" . ($apiUser['image_url'] === $excoUser['image_url'] ? '✅' : '❌') . "</td></tr>";
                echo "</table>";
            } else {
                echo "<p class='error'>❌ User not found in API response</p>";
            }
        } else {
            echo "<p class='error'>❌ API error: " . ($data['error'] ?? 'Unknown error') . "</p>";
        }
    } else {
        echo "<p class='error'>❌ Could not reach API endpoint</p>";
    }
    
    // Check file system
    echo "<h3>📁 File System Check</h3>";
    if ($user && $user['avatar']) {
        $imagePath = $user['avatar'];
        $fullPath = __DIR__ . '/' . $imagePath;
        
        if (file_exists($fullPath)) {
            $fileSize = filesize($fullPath);
            echo "<p class='success'>✅ Image file exists: $imagePath (Size: " . number_format($fileSize) . " bytes)</p>";
        } else {
            echo "<p class='error'>❌ Image file not found: $imagePath</p>";
            echo "<p class='info'>ℹ️ Looking for: $fullPath</p>";
            
            // List available files in profile_photos
            $profileDir = __DIR__ . '/profile_photos/';
            if (is_dir($profileDir)) {
                $files = scandir($profileDir);
                $imageFiles = array_filter($files, function($file) {
                    return !in_array($file, ['.', '..']);
                });
                
                echo "<p class='info'>ℹ️ Available files in profile_photos:</p>";
                echo "<ul>";
                foreach ($imageFiles as $file) {
                    echo "<li>$file</li>";
                }
                echo "</ul>";
            }
        }
    }
    
    echo "<h3>💡 Recommendations</h3>";
    echo "<ol>";
    echo "<li><strong>Phone Number:</strong> " . ($user && $excoUser && $user['phone'] === $excoUser['phone'] ? "<span class='success'>✅ Working correctly</span>" : "<span class='error'>❌ Needs fixing</span>") . "</li>";
    echo "<li><strong>Profile Photo:</strong> " . ($user && $excoUser && $user['avatar'] === $excoUser['image_url'] ? "<span class='success'>✅ Working correctly</span>" : "<span class='error'>❌ Needs fixing</span>") . "</li>";
    echo "<li><strong>Frontend Refresh:</strong> Use the Force Refresh button in EXCO Users tab</li>";
    echo "<li><strong>Cache:</strong> Clear browser cache and hard refresh (Ctrl+F5)</li>";
    echo "</ol>";
    
} catch (Exception $e) {
    echo "<p class='error'>❌ Error: " . $e->getMessage() . "</p>";
}
?>

<script>
// Auto-refresh this page every 10 seconds
setTimeout(function() {
    location.reload();
}, 10000);
</script>
