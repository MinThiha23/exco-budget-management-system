<?php
require_once 'config.php';

// CORS headers
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $pdo = getConnection();
    
    echo "<h2>Cleaning Up Notifications</h2>";
    
    // Show current notifications
    echo "<h3>Current Notifications in Database:</h3>";
    $stmt = $pdo->query("SELECT id, user_id, title, message, created_at FROM notifications ORDER BY created_at DESC");
    $notifications = $stmt->fetchAll();
    
    if (count($notifications) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>User ID</th><th>Title</th><th>Message</th><th>Created</th></tr>";
        
        foreach ($notifications as $notification) {
            echo "<tr>";
            echo "<td>" . $notification['id'] . "</td>";
            echo "<td>" . ($notification['user_id'] ?? 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($notification['title']) . "</td>";
            echo "<td>" . htmlspecialchars(substr($notification['message'], 0, 50)) . "...</td>";
            echo "<td>" . $notification['created_at'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "No notifications found.<br>";
    }
    
    echo "<br>";
    
    // Option to clean up old notifications
    if (isset($_GET['cleanup']) && $_GET['cleanup'] === 'true') {
        echo "<h3>Cleaning Up Notifications...</h3>";
        
        // Delete notifications older than 7 days (optional cleanup)
        $stmt = $pdo->prepare("DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");
        $result = $stmt->execute();
        
        if ($result) {
            $deletedCount = $stmt->rowCount();
            echo "✅ Deleted " . $deletedCount . " old notifications (older than 7 days)<br>";
        }
        
        // Show remaining notifications
        echo "<h3>Remaining Notifications:</h3>";
        $stmt = $pdo->query("SELECT id, user_id, title, message, created_at FROM notifications ORDER BY created_at DESC");
        $remainingNotifications = $stmt->fetchAll();
        
        if (count($remainingNotifications) > 0) {
            echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr><th>ID</th><th>User ID</th><th>Title</th><th>Message</th><th>Created</th></tr>";
            
            foreach ($remainingNotifications as $notification) {
                echo "<tr>";
                echo "<td>" . $notification['id'] . "</td>";
                echo "<td>" . ($notification['user_id'] ?? 'NULL') . "</td>";
                echo "<td>" . htmlspecialchars($notification['title']) . "</td>";
                echo "<td>" . htmlspecialchars(substr($notification['message'], 0, 50)) . "...</td>";
                echo "<td>" . $notification['created_at'] . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "No notifications remaining.<br>";
        }
    } else {
        echo "<h3>To clean up old notifications, visit:</h3>";
        echo "<a href='?cleanup=true'>Clean up notifications older than 7 days</a><br><br>";
    }
    
    // Show notification targeting rules
    echo "<h3>Notification Targeting Rules:</h3>";
    echo "<ul>";
    echo "<li><strong>Admin users:</strong> Can see their own notifications + system notifications (user_id = NULL)</li>";
    echo "<li><strong>Regular users:</strong> Can only see their own notifications (user_id = their ID)</li>";
    echo "<li><strong>System notifications:</strong> Only visible to admin users</li>";
    echo "<li><strong>User-specific notifications:</strong> Only visible to the specific user</li>";
    echo "</ul>";
    
    // Test the notification fetching for different users
    echo "<h3>Test Notification Fetching:</h3>";
    
    $stmt = $pdo->query("SELECT id, name, email, role FROM users WHERE role IN ('admin', 'user', 'finance') LIMIT 3");
    $users = $stmt->fetchAll();
    
    foreach ($users as $user) {
        echo "<h4>User: " . $user['name'] . " (Role: " . $user['role'] . ")</h4>";
        
        if ($user['role'] === 'admin') {
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? OR user_id IS NULL");
        } else {
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ?");
        }
        $stmt->execute([$user['id']]);
        $count = $stmt->fetch()['count'];
        
        echo "This user can see " . $count . " notifications<br>";
        
        // Show what notifications they can see
        if ($user['role'] === 'admin') {
            $stmt = $pdo->prepare("SELECT title FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 5");
        } else {
            $stmt = $pdo->prepare("SELECT title FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5");
        }
        $stmt->execute([$user['id']]);
        $userNotifications = $stmt->fetchAll();
        
        if (count($userNotifications) > 0) {
            echo "Sample notifications: ";
            foreach ($userNotifications as $notification) {
                echo "'" . $notification['title'] . "', ";
            }
            echo "<br>";
        }
        echo "<br>";
    }
    
} catch (Exception $e) {
    echo "<h2>Error</h2>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?> 