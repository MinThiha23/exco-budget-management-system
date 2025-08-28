<?php
require_once 'config.php';

// Content-Type header (CORS handled centrally in config.php)
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getConnection();
    
    switch ($method) {
        case 'GET':
            // Get notifications for an EXCO user
            if (isset($_GET['exco_user_id'])) {
                $excoUserId = $_GET['exco_user_id'];
                
                // First, get the EXCO user's email from exco_users table
                $stmt = $pdo->prepare("SELECT email, name FROM exco_users WHERE id = ?");
                $stmt->execute([$excoUserId]);
                $excoUser = $stmt->fetch();
                
                if (!$excoUser) {
                    sendError('EXCO user not found', 404);
                }
                
                // Now find the regular user with the same email
                $stmt = $pdo->prepare("SELECT id, role FROM users WHERE email = ?");
                $stmt->execute([$excoUser['email']]);
                $regularUser = $stmt->fetch();
                
                if (!$regularUser) {
                    // No regular user found, return empty notifications
                    sendResponse([
                        'success' => true,
                        'notifications' => [],
                        'unread_count' => 0,
                        'message' => 'No regular user account found for this EXCO user'
                    ]);
                    return;
                }
                
                $regularUserId = $regularUser['id'];
                $userRole = $regularUser['role'];
                
                // Build the query based on user role
                if ($userRole === 'admin') {
                    // Admin can see all notifications (user-specific + system notifications)
                    $stmt = $pdo->prepare("
                        SELECT * FROM notifications 
                        WHERE user_id = ? OR user_id IS NULL 
                        ORDER BY created_at DESC 
                        LIMIT 20
                    ");
                    $stmt->execute([$regularUserId]);
                    $notifications = $stmt->fetchAll();
                    
                    // Get unread count for admin
                    $stmt = $pdo->prepare("
                        SELECT COUNT(*) as unread_count 
                        FROM notifications 
                        WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0
                    ");
                    $stmt->execute([$regularUserId]);
                    $unreadCount = $stmt->fetch()['unread_count'];
                } else {
                    // Regular user notifications
                    $stmt = $pdo->prepare("
                        SELECT * FROM notifications 
                        WHERE user_id = ? 
                        ORDER BY created_at DESC 
                        LIMIT 20
                    ");
                    $stmt->execute([$regularUserId]);
                    $notifications = $stmt->fetchAll();
                    
                    // Get unread count for regular user
                    $stmt = $pdo->prepare("
                        SELECT COUNT(*) as unread_count 
                        FROM notifications 
                        WHERE user_id = ? AND is_read = 0
                    ");
                    $stmt->execute([$regularUserId]);
                    $unreadCount = $stmt->fetch()['unread_count'];
                }
                
                sendResponse([
                    'success' => true,
                    'notifications' => $notifications,
                    'unread_count' => $unreadCount,
                    'exco_user' => $excoUser['name'],
                    'regular_user_id' => $regularUserId,
                    'user_role' => $userRole
                ]);
            } else {
                sendError('EXCO user ID required', 400);
            }
            break;
            
        default:
            sendError('Method not allowed', 405);
            break;
    }
} catch (Exception $e) {
    error_log("EXCO Notifications API Error: " . $e->getMessage());
    sendError('Internal server error: ' . $e->getMessage(), 500);
}
?>
