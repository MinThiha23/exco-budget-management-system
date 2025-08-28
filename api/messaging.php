<?php
require_once 'config.php';
// Content-Type header (CORS handled centrally in config.php)
header('Content-Type: application/json');

try {
    $pdo = getConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    // For POST requests, also check the request body for action
    if ($method === 'POST') {
        $postData = json_decode(file_get_contents('php://input'), true);
        if (isset($postData['action'])) {
            $action = $postData['action'];
        }
    }

    switch ($method) {
        case 'GET':
            switch ($action) {
                case 'getConversations':
                    getConversations();
                    break;
                case 'bootstrapDirectConversations':
                    bootstrapDirectConversations();
                    break;
                case 'getMessages':
                    getMessages();
                    break;
                case 'getUnreadCount':
                    getUnreadCount();
                    break;
                case 'searchUsers':
                    searchUsers();
                    break;
                default:
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid action']);
                    break;
            }
            break;
            
        case 'POST':
            switch ($action) {
                case 'getConversations':
                    getConversations();
                    break;
                case 'getMessages':
                    getMessages();
                    break;
                case 'getUnreadCount':
                    getUnreadCount();
                    break;
                case 'searchUsers':
                    searchUsers();
                    break;
                case 'createConversation':
                    createConversation();
                    break;
                case 'sendMessage':
                    sendMessage();
                    break;
                case 'bootstrapDirectConversations':
                    bootstrapDirectConversations();
                    break;
                case 'markAsRead':
                    markAsRead();
                    break;
                case 'addParticipant':
                    addParticipant();
                    break;
                case 'removeParticipant':
                    removeParticipant();
                    break;
                default:
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid action']);
                    break;
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    error_log("Messaging API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function getConversations() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = $data['user_id'] ?? null;
        
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID required']);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                c.id,
                c.title,
                c.type,
                c.program_id,
                c.created_at,
                c.updated_at,
                (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = 0 AND m.sender_id != ?) as unread_count,
                (SELECT m.message_text FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time
            FROM conversations c
            INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = ? AND cp.is_active = 1
            ORDER BY c.updated_at DESC
        ");
        
        $stmt->execute([$userId, $userId]);
        $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get participant details for each conversation
        foreach ($conversations as &$conversation) {
            $stmt = $pdo->prepare("
                SELECT u.id, u.name, u.email, u.role, u.avatar
                FROM conversation_participants cp
                INNER JOIN users u ON cp.user_id = u.id
                WHERE cp.conversation_id = ? AND cp.is_active = 1
                ORDER BY u.name
            ");
            $stmt->execute([$conversation['id']]);
            $conversation['participants'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode(['success' => true, 'conversations' => $conversations]);
        
    } catch (Exception $e) {
        error_log("Error getting conversations: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get conversations']);
    }
}

function getMessages() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $conversationId = $data['conversation_id'] ?? null;
        $userId = $data['user_id'] ?? null;
        
        if (!$conversationId || !$userId) {
            http_response_code(400);
            echo json_encode(['error' => 'Conversation ID and User ID required']);
            return;
        }
        
        // Check if user is participant
        $stmt = $pdo->prepare("SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ? AND is_active = 1");
        $stmt->execute([$conversationId, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            return;
        }
        
        // Get messages
        $stmt = $pdo->prepare("
            SELECT 
                m.id,
                m.sender_id,
                m.message_text,
                m.message_type,
                m.file_url,
                m.file_name,
                m.file_size,
                m.is_read,
                m.created_at,
                u.name as sender_name,
                u.avatar as sender_avatar
            FROM messages m
            INNER JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC
        ");
        
        $stmt->execute([$conversationId]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Mark messages as read
        $stmt = $pdo->prepare("
            UPDATE messages 
            SET is_read = 1 
            WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
        ");
        $stmt->execute([$conversationId, $userId]);
        
        echo json_encode(['success' => true, 'messages' => $messages]);
        
    } catch (Exception $e) {
        error_log("Error getting messages: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get messages']);
    }
}

function sendMessage() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $conversationId = $data['conversation_id'] ?? null;
        $senderId = $data['sender_id'] ?? null;
        $messageText = $data['message_text'] ?? null;
        $messageType = $data['message_type'] ?? 'text';
        $fileUrl = $data['file_url'] ?? null;
        $fileName = $data['file_name'] ?? null;
        $fileSize = $data['file_size'] ?? null;
        
        if (!$conversationId || !$senderId || !$messageText) {
            http_response_code(400);
            echo json_encode(['error' => 'Conversation ID, Sender ID, and Message Text required']);
            return;
        }
        
        // Check if user is participant
        $stmt = $pdo->prepare("SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ? AND is_active = 1");
        $stmt->execute([$conversationId, $senderId]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            return;
        }
        
        // Insert message
        $stmt = $pdo->prepare("
            INSERT INTO messages (conversation_id, sender_id, message_text, message_type, file_url, file_name, file_size)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([$conversationId, $senderId, $messageText, $messageType, $fileUrl, $fileName, $fileSize]);
        
        if ($result) {
            $messageId = $pdo->lastInsertId();
            
            // Update conversation timestamp
            $stmt = $pdo->prepare("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$conversationId]);
            
            // Get the created message with sender details
            $stmt = $pdo->prepare("
                SELECT 
                    m.id,
                    m.sender_id,
                    m.message_text,
                    m.message_type,
                    m.file_url,
                    m.file_name,
                    m.file_size,
                    m.is_read,
                    m.created_at,
                    u.name as sender_name,
                    u.avatar as sender_avatar
                FROM messages m
                INNER JOIN users u ON m.sender_id = u.id
                WHERE m.id = ?
            ");
            $stmt->execute([$messageId]);
            $message = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'message' => $message]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to send message']);
        }
        
    } catch (Exception $e) {
        error_log("Error sending message: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to send message']);
    }
}

function createConversation() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $title = $data['title'] ?? null;
        $type = $data['type'] ?? 'direct';
        $createdBy = $data['created_by'] ?? null;
        $participants = $data['participants'] ?? [];
        $programId = $data['program_id'] ?? null;
        
        if (!$title || !$createdBy || empty($participants)) {
            http_response_code(400);
            echo json_encode(['error' => 'Title, Created By, and Participants required']);
            return;
        }
        
        // Start transaction
        $pdo->beginTransaction();
        
        // Create conversation
        $stmt = $pdo->prepare("
            INSERT INTO conversations (title, type, created_by, program_id)
            VALUES (?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([$title, $type, $createdBy, $programId]);
        
        if ($result) {
            $conversationId = $pdo->lastInsertId();
            
            // Add participants
            foreach ($participants as $participantId) {
                $stmt = $pdo->prepare("
                    INSERT INTO conversation_participants (conversation_id, user_id, role)
                    VALUES (?, ?, ?)
                ");
                $role = ($participantId == $createdBy) ? 'admin' : 'member';
                $stmt->execute([$conversationId, $participantId, $role]);
            }
            
            $pdo->commit();
            
            echo json_encode(['success' => true, 'conversation_id' => $conversationId]);
        } else {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create conversation']);
        }
        
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Error creating conversation: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create conversation']);
    }
}

function getUnreadCount() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = $data['user_id'] ?? null;
        
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID required']);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as unread_count
            FROM messages m
            INNER JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
            WHERE cp.user_id = ? AND m.sender_id != ? AND m.is_read = 0 AND cp.is_active = 1
        ");
        
        $stmt->execute([$userId, $userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'unread_count' => $result['unread_count']]);
        
    } catch (Exception $e) {
        error_log("Error getting unread count: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get unread count']);
    }
}

function markAsRead() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $conversationId = $data['conversation_id'] ?? null;
        $userId = $data['user_id'] ?? null;
        
        if (!$conversationId || !$userId) {
            http_response_code(400);
            echo json_encode(['error' => 'Conversation ID and User ID required']);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE messages 
            SET is_read = 1 
            WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
        ");
        
        $result = $stmt->execute([$conversationId, $userId]);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to mark as read']);
        }
        
    } catch (Exception $e) {
        error_log("Error marking as read: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to mark as read']);
    }
}

function searchUsers() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $searchTerm = $data['search_term'] ?? '';
        $currentUserId = $data['current_user_id'] ?? null;
        
        if (!$currentUserId) {
            http_response_code(400);
            echo json_encode(['error' => 'Current User ID required']);
            return;
        }
        
        // Get current user's role
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$currentUserId]);
        $currentUser = $stmt->fetch();
        
        if (!$currentUser) {
            http_response_code(400);
            echo json_encode(['error' => 'Current user not found']);
            return;
        }
        
        // If current user is a regular user, only show finance roles
        // If current user is finance, only show regular users
        if ($currentUser['role'] === 'user') {
            $stmt = $pdo->prepare("
                SELECT id, name, email, role, avatar
                FROM users 
                WHERE (name LIKE ? OR email LIKE ?) 
                AND id != ? 
                AND role IN ('Finance MMK', 'finance_officer')
                AND is_active = 1
                ORDER BY name
                LIMIT 20
            ");
        } else if (in_array($currentUser['role'], ['Finance MMK', 'finance_officer'])) {
            $stmt = $pdo->prepare("
                SELECT id, name, email, role, avatar
                FROM users 
                WHERE (name LIKE ? OR email LIKE ?) 
                AND id != ? 
                AND role = 'user'
                AND is_active = 1
                ORDER BY name
                LIMIT 20
            ");
        } else {
            // Admin can see all users
            $stmt = $pdo->prepare("
                SELECT id, name, email, role, avatar
                FROM users 
                WHERE (name LIKE ? OR email LIKE ?) 
                AND id != ? 
                AND is_active = 1
                ORDER BY name
                LIMIT 20
            ");
        }
        
        $searchPattern = "%$searchTerm%";
        $stmt->execute([$searchPattern, $searchPattern, $currentUserId]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'users' => $users]);
        
    } catch (Exception $e) {
        error_log("Error searching users: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to search users']);
    }
}

// Ensure direct conversations exist between each EXCO user and all finance officers
function bootstrapDirectConversations() {
    global $pdo;
    try {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $actorId = $data['actor_id'] ?? null; // optional, for auditing

        // Fetch EXCO users (role 'user') and finance officers
        $excoStmt = $pdo->query("SELECT id, name FROM users WHERE role = 'user' AND is_active = 1");
        $excoUsers = $excoStmt->fetchAll(PDO::FETCH_ASSOC);

        $financeStmt = $pdo->query("SELECT id, name FROM users WHERE role IN ('Finance MMK', 'finance_officer') AND is_active = 1");
        $financeUsers = $financeStmt->fetchAll(PDO::FETCH_ASSOC);

        $created = 0;

        foreach ($excoUsers as $exco) {
            foreach ($financeUsers as $fin) {
                // Check if a direct conversation already exists for this pair
                $check = $pdo->prepare("
                    SELECT c.id
                    FROM conversations c
                    JOIN conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = ? AND p1.is_active = 1
                    JOIN conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = ? AND p2.is_active = 1
                    WHERE c.type = 'direct'
                    LIMIT 1
                ");
                $check->execute([$exco['id'], $fin['id']]);
                $existing = $check->fetch(PDO::FETCH_ASSOC);
                if ($existing) {
                    continue; // already exists
                }

                // Create a new direct conversation
                $pdo->beginTransaction();
                $title = "Chat: " . $exco['name'] . " ↔ " . $fin['name'];
                $createConv = $pdo->prepare("INSERT INTO conversations (title, type, created_by) VALUES (?, 'direct', ?)");
                $createConv->execute([$title, $actorId ?? $fin['id']]);
                $conversationId = $pdo->lastInsertId();

                // Add both participants
                $addP = $pdo->prepare("INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES (?, ?, ?)");
                $addP->execute([$conversationId, $fin['id'], 'admin']);
                $addP->execute([$conversationId, $exco['id'], 'member']);
                $pdo->commit();
                $created++;

                // Optional: send a welcome message
                $welcome = $pdo->prepare("INSERT INTO messages (conversation_id, sender_id, message_text, message_type) VALUES (?, ?, ?, 'system')");
                $welcome->execute([$conversationId, $fin['id'], 'This conversation was created to facilitate direct communication with finance.']);
            }
        }

        echo json_encode(['success' => true, 'created' => $created]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Error bootstrapping conversations: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to bootstrap conversations']);
    }
}

function addParticipant() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $conversationId = $data['conversation_id'] ?? null;
        $userId = $data['user_id'] ?? null;
        $addedBy = $data['added_by'] ?? null;
        
        if (!$conversationId || !$userId || !$addedBy) {
            http_response_code(400);
            echo json_encode(['error' => 'Conversation ID, User ID, and Added By required']);
            return;
        }
        
        // Check if user adding is admin
        $stmt = $pdo->prepare("SELECT role FROM conversation_participants WHERE conversation_id = ? AND user_id = ? AND is_active = 1");
        $stmt->execute([$conversationId, $addedBy]);
        $participant = $stmt->fetch();
        
        if (!$participant || $participant['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Only admins can add participants']);
            return;
        }
        
        // Add participant
        $stmt = $pdo->prepare("
            INSERT INTO conversation_participants (conversation_id, user_id, role)
            VALUES (?, ?, 'member')
            ON DUPLICATE KEY UPDATE is_active = 1
        ");
        
        $result = $stmt->execute([$conversationId, $userId]);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to add participant']);
        }
        
    } catch (Exception $e) {
        error_log("Error adding participant: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add participant']);
    }
}

function removeParticipant() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $conversationId = $data['conversation_id'] ?? null;
        $userId = $data['user_id'] ?? null;
        $removedBy = $data['removed_by'] ?? null;
        
        if (!$conversationId || !$userId || !$removedBy) {
            http_response_code(400);
            echo json_encode(['error' => 'Conversation ID, User ID, and Removed By required']);
            return;
        }
        
        // Check if user removing is admin
        $stmt = $pdo->prepare("SELECT role FROM conversation_participants WHERE conversation_id = ? AND user_id = ? AND is_active = 1");
        $stmt->execute([$conversationId, $removedBy]);
        $participant = $stmt->fetch();
        
        if (!$participant || $participant['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Only admins can remove participants']);
            return;
        }
        
        // Remove participant
        $stmt = $pdo->prepare("UPDATE conversation_participants SET is_active = 0 WHERE conversation_id = ? AND user_id = ?");
        
        $result = $stmt->execute([$conversationId, $userId]);
        
        if ($result) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to remove participant']);
        }
        
    } catch (Exception $e) {
        error_log("Error removing participant: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to remove participant']);
    }
}
?>
