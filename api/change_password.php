<?php
require_once 'config.php';

// Content-Type header (CORS handled centrally in config.php)
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($input['user_id']) || !isset($input['current_password']) || !isset($input['new_password'])) {
        sendError('Missing required fields: user_id, current_password, new_password', 400);
    }
    
    $userId = $input['user_id'];
    $currentPassword = $input['current_password'];
    $newPassword = $input['new_password'];
    
    // Validate new password length
    if (strlen($newPassword) < 6) {
        sendError('New password must be at least 6 characters long', 400);
    }
    
    $pdo = getConnection();
    
    // Get current user to verify current password
    $stmt = $pdo->prepare("SELECT id, password FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendError('User not found', 404);
    }
    
    // Verify current password
    if (!verifyPassword($currentPassword, $user['password'])) {
        sendError('Current password is incorrect', 401);
    }
    
    // Hash new password
    $newPasswordHash = hashPassword($newPassword);
    
    // Update password in database
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $result = $stmt->execute([$newPasswordHash, $userId]);
    
    if ($result) {
        // Log the password change activity
        try {
            $pdo = getConnection();
            $stmt = $pdo->prepare("
                INSERT INTO activity_logs (user_id, action, table_name, record_id, details, ip_address) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                'password_change',
                'users',
                $userId,
                json_encode(['message' => 'Password changed successfully']),
                $_SERVER['REMOTE_ADDR'] ?? null
            ]);
        } catch (Exception $e) {
            // Don't fail the main operation if logging fails
            error_log("Activity logging failed: " . $e->getMessage());
        }
        
        // Also notify admin about password change (if not admin changing their own password)
        if ($userId != 1) { // Assuming admin user ID is 1
            try {
                $pdo = getConnection();
                $stmt = $pdo->prepare("SELECT name, email FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch();
                
                if ($user) {
                    $stmt = $pdo->prepare("
                        INSERT INTO notifications (user_id, title, message, type, is_read, created_at) 
                        VALUES (?, ?, ?, ?, 0, NOW())
                    ");
                    $stmt->execute([
                        null, // System-wide notification for admin
                        "User Password Changed",
                        "User '{$user['name']}' ({$user['email']}) has changed their password.",
                        'info'
                    ]);
                }
            } catch (Exception $e) {
                // Don't fail the main operation if admin notification fails
                error_log("Admin notification failed: " . $e->getMessage());
            }
        }
        
        sendResponse([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    } else {
        sendError('Failed to update password', 500);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?> 