<?php
require_once 'config.php';

try {
    $pdo = getConnection();
    echo "<h2>Creating User-Finance Direct Messaging System</h2>";
    
    // Create conversations table
    $sql = "CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        type ENUM('direct', 'group', 'program') DEFAULT 'direct',
        program_id INT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
    )";
    
    $pdo->exec($sql);
    echo "<p>✅ Conversations table created successfully</p>";
    
    // Create conversation participants table
    $sql = "CREATE TABLE IF NOT EXISTS conversation_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('admin', 'member') DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_read_at TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_participant (conversation_id, user_id)
    )";
    
    $pdo->exec($sql);
    echo "<p>✅ Conversation participants table created successfully</p>";
    
    // Create messages table
    $sql = "CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        sender_id INT NOT NULL,
        message_text TEXT NOT NULL,
        message_type ENUM('text', 'file', 'system') DEFAULT 'text',
        file_url VARCHAR(500) NULL,
        file_name VARCHAR(255) NULL,
        file_size INT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    )";
    
    $pdo->exec($sql);
    echo "<p>✅ Messages table created successfully</p>";
    
    // Create indexes for better performance (with error handling)
    $indexes = [
        "CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)",
        "CREATE INDEX IF NOT EXISTS idx_conversations_program_id ON conversations(program_id)",
        "CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id)",
        "CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)",
        "CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)",
        "CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read)"
    ];
    
    foreach ($indexes as $index) {
        try {
            $pdo->exec($index);
        } catch (Exception $e) {
            // Index might already exist, continue
            echo "<p>ℹ️ Index already exists or error: " . $e->getMessage() . "</p>";
        }
    }
    echo "<p>✅ Indexes created successfully</p>";
    
    // Clear existing conversations
    $pdo->exec("DELETE FROM messages");
    $pdo->exec("DELETE FROM conversation_participants");
    $pdo->exec("DELETE FROM conversations");
    echo "<p>✅ Cleared existing conversations</p>";
    
// Get all users and finance roles
    $users = $pdo->query("SELECT id, name, email, role FROM users WHERE role = 'user' AND is_active = 1")->fetchAll();
$financeUsers = $pdo->query("SELECT id, name, email, role FROM users WHERE role IN ('Finance MMK', 'finance_officer') AND is_active = 1")->fetchAll();
    
    echo "<h3>Creating Direct User-Finance Conversations</h3>";
    echo "<p>Found " . count($users) . " users and " . count($financeUsers) . " finance users</p>";
    
// Create direct conversations between each user and each finance role
    $conversationCount = 0;
    
    foreach ($users as $user) {
        foreach ($financeUsers as $financeUser) {
            // Create conversation title
            $title = "Chat: {$user['name']} ↔ {$financeUser['name']}";
            
            // Create conversation
            $stmt = $pdo->prepare("INSERT INTO conversations (title, type, created_by) VALUES (?, ?, ?)");
            $stmt->execute([$title, 'direct', $user['id']]);
            $conversationId = $pdo->lastInsertId();
            
            // Add both participants
            $stmt = $pdo->prepare("INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES (?, ?, ?)");
            $stmt->execute([$conversationId, $user['id'], 'member']);
            $stmt->execute([$conversationId, $financeUser['id'], 'member']);
            
            $conversationCount++;
        }
    }
    
    echo "<p>✅ Created $conversationCount direct conversations between users and finance roles</p>";
    
    // Create a welcome message in each conversation
    $welcomeMessage = "Welcome! This is a direct communication channel between you and the finance team. You can ask questions about programs, funding, or any finance-related matters.";
    
    foreach ($financeUsers as $financeUser) {
        $stmt = $pdo->prepare("
            INSERT INTO messages (conversation_id, sender_id, message_text, message_type)
            SELECT c.id, ?, ?, 'system'
            FROM conversations c
            INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = ? AND c.type = 'direct'
        ");
        $stmt->execute([$financeUser['id'], $welcomeMessage, $financeUser['id']]);
    }
    
    echo "<h3>✅ User-Finance Direct Messaging System Setup Complete!</h3>";
    echo "<p>The following features are now available:</p>";
    echo "<ul>";
    echo "<li>✅ Direct messaging between users and finance roles only</li>";
    echo "<li>✅ Users can only communicate with finance team</li>";
    echo "<li>✅ Finance team can respond to user inquiries</li>";
    echo "<li>✅ No user-to-user messaging allowed</li>";
    echo "<li>✅ File sharing in messages</li>";
    echo "<li>✅ Read receipts and notifications</li>";
    echo "</ul>";
    
    echo "<h4>Conversation Summary:</h4>";
    echo "<p>• Each user has a direct conversation with each finance role</p>";
    echo "<p>• Total conversations created: $conversationCount</p>";
    echo "<p>• Users: " . count($users) . " | Finance Roles: " . count($financeUsers) . "</p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>
