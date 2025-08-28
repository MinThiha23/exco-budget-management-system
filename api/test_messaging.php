<?php
require_once 'config.php';

try {
    $pdo = getConnection();
    echo "<h2>Testing Messaging System</h2>";
    
    // Check if messaging tables exist
    $tables = ['conversations', 'conversation_participants', 'messages'];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "<p>✅ Table '$table' exists</p>";
            
            // Count records
            $count = $pdo->query("SELECT COUNT(*) as count FROM $table")->fetch()['count'];
            echo "<p>📊 Records in $table: $count</p>";
        } else {
            echo "<p>❌ Table '$table' does not exist</p>";
        }
    }
    
    // Test user data
    echo "<h3>Testing User Data</h3>";
    $users = $pdo->query("SELECT id, name, email, role FROM users WHERE is_active = 1 LIMIT 5")->fetchAll();
    echo "<p>Found " . count($users) . " active users:</p>";
    foreach ($users as $user) {
        echo "<p>- ID: {$user['id']}, Name: {$user['name']}, Role: {$user['role']}</p>";
    }
    
    // Test API endpoints
    echo "<h3>Testing API Endpoints</h3>";
    
    // Test getConversations
    $testData = [
        'action' => 'getConversations',
        'user_id' => 1
    ];
    
    echo "<p>Testing getConversations with user_id=1...</p>";
    
    // Simulate the API call
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_GET['action'] = 'getConversations';
    
    // Capture output
    ob_start();
    
    // Include the messaging API
    include 'messaging.php';
    
    $output = ob_get_clean();
    echo "<p>API Response: $output</p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>
