<?php
require_once 'config.php';
 
// Content-Type header (CORS handled centrally in config.php)
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getConnection();
    
    switch ($method) {
        case 'GET':
            // Get notifications for a user
            if (isset($_GET['user_id'])) {
                $userId = $_GET['user_id'];
                
                // First, get the user's role to determine what notifications they should see
                $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();
                
                if (!$user) {
                    sendError('User not found', 404);
                }
                
                // Build the query based on user role
                if ($user['role'] === 'admin') {
                    // Admin can see all notifications (user-specific + system notifications)
                    $stmt = $pdo->prepare("
                        SELECT * FROM notifications 
                        WHERE user_id = ? OR user_id IS NULL 
                        ORDER BY created_at DESC 
                        LIMIT 20
                    ");
                    $stmt->execute([$userId]);
                    $notifications = $stmt->fetchAll();
                    
                    // Get unread count for admin
                    $stmt = $pdo->prepare("
                        SELECT COUNT(*) as unread_count 
                        FROM notifications 
                        WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0
                    ");
                    $stmt->execute([$userId]);
                    $unreadCount = $stmt->fetch()['unread_count'];
                } else {
                    // Regular users can only see their own notifications
                    $stmt = $pdo->prepare("
                        SELECT * FROM notifications 
                        WHERE user_id = ? 
                        ORDER BY created_at DESC 
                        LIMIT 20
                    ");
                    $stmt->execute([$userId]);
                    $notifications = $stmt->fetchAll();
                    
                    // Get unread count for regular user
                    $stmt = $pdo->prepare("
                        SELECT COUNT(*) as unread_count 
                        FROM notifications 
                        WHERE user_id = ? AND is_read = 0
                    ");
                    $stmt->execute([$userId]);
                    $unreadCount = $stmt->fetch()['unread_count'];
                }
                
                sendResponse([
                    'success' => true,
                    'notifications' => $notifications,
                    'unread_count' => $unreadCount
                ]);
            } else {
                sendError('User ID required', 400);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['action'])) {
                sendError('Action required', 400);
            }
            
            switch ($input['action']) {
                case 'mark_read':
                    if (!isset($input['notification_id'])) {
                        sendError('Notification ID required', 400);
                    }
                    
                    $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
                    $result = $stmt->execute([$input['notification_id']]);
                    
                    if ($result) {
                        sendResponse(['success' => true, 'message' => 'Notification marked as read']);
                    } else {
                        sendError('Failed to mark notification as read', 500);
                    }
                    break;
                    
                case 'mark_all_read':
                    if (!isset($input['user_id'])) {
                        sendError('User ID required', 400);
                    }
                    
                    $userId = $input['user_id'];
                    
                    // Get the user's role to determine what notifications they can mark as read
                    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
                    $stmt->execute([$userId]);
                    $user = $stmt->fetch();
                    
                    if (!$user) {
                        sendError('User not found', 404);
                    }
                    
                    if ($user['role'] === 'admin') {
                        // Admin can mark all notifications as read (user-specific + system notifications)
                        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL");
                        $result = $stmt->execute([$userId]);
                    } else {
                        // Regular users can only mark their own notifications as read
                        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
                        $result = $stmt->execute([$userId]);
                    }
                    
                    if ($result) {
                        sendResponse(['success' => true, 'message' => 'All notifications marked as read']);
                    } else {
                        sendError('Failed to mark notifications as read', 500);
                    }
                    break;
                    
                case 'create':
                    // Create a new notification (for system use)
                    if (!isset($input['title']) || !isset($input['message'])) {
                        sendError('Title and message required', 400);
                    }
                    
                    $stmt = $pdo->prepare("
                        INSERT INTO notifications (user_id, title, message, type, is_read, created_at) 
                        VALUES (?, ?, ?, ?, 0, NOW())
                    ");
                    $result = $stmt->execute([
                        $input['user_id'] ?? null,
                        $input['title'],
                        $input['message'],
                        $input['type'] ?? 'info'
                    ]);
                    
                    if ($result) {
                        sendResponse(['success' => true, 'message' => 'Notification created']);
                    } else {
                        sendError('Failed to create notification', 500);
                    }
                    break;
                    
                case 'delete_notification':
                    if (!isset($input['notification_id'])) {
                        sendError('Notification ID required', 400);
                    }
                    
                    $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = ?");
                    $result = $stmt->execute([$input['notification_id']]);
                    
                    if ($result) {
                        sendResponse(['success' => true, 'message' => 'Notification deleted']);
                    } else {
                        sendError('Failed to delete notification', 500);
                    }
                    break;
                    
                case 'delete_all_notifications':
                    if (!isset($input['user_id'])) {
                        sendError('User ID required', 400);
                    }
                    
                    $userId = $input['user_id'];
                    
                    // Get the user's role to determine what notifications they can delete
                    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
                    $stmt->execute([$userId]);
                    $user = $stmt->fetch();
                    
                    if (!$user) {
                        sendError('User not found', 404);
                    }
                    
                    if ($user['role'] === 'admin') {
                        // Admin can delete all notifications (user-specific + system notifications)
                        $stmt = $pdo->prepare("DELETE FROM notifications WHERE user_id = ? OR user_id IS NULL");
                        $result = $stmt->execute([$userId]);
                    } else {
                        // Regular users can only delete their own notifications
                        $stmt = $pdo->prepare("DELETE FROM notifications WHERE user_id = ?");
                        $result = $stmt->execute([$userId]);
                    }
                    
                    if ($result) {
                        sendResponse(['success' => true, 'message' => 'All notifications deleted']);
                    } else {
                        sendError('Failed to delete notifications', 500);
                    }
                    break;
                    
                default:
                    sendError('Invalid action', 400);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?> 