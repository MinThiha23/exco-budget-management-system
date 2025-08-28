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
    
    if (!isset($input['user_id'])) {
        throw new Exception('User ID is required');
    }
    
    $userId = $input['user_id'];
    $pdo = getConnection();
    
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    if (!$stmt->fetch()) {
        throw new Exception('User not found');
    }
    
    // Check if email is being updated and if it's already taken by another user
    if (isset($input['email'])) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->execute([$input['email'], $userId]);
        if ($stmt->fetch()) {
            throw new Exception('Email address is already taken by another user');
        }
    }
    
    // Prepare update fields
    $updateFields = [];
    $params = [];
    
    $allowedFields = ['name', 'email', 'phone', 'location'];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updateFields[] = "$field = ?";
            $params[] = $input[$field];
        }
    }
    
    if (empty($updateFields)) {
        throw new Exception('No fields to update');
    }
    
    // Add user_id to params
    $params[] = $userId;
    
    // Build and execute update query
    $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Get updated user data
    $stmt = $pdo->prepare("SELECT id, name, email, role, phone, location, avatar, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $updatedUser = $stmt->fetch();
    
    // Also update the exco_users table if this user exists there
    if ($updatedUser) {
        try {
            // Check if user exists in exco_users table
            $stmt = $pdo->prepare("SELECT id FROM exco_users WHERE email = ?");
            $stmt->execute([$updatedUser['email']]);
            
            if ($stmt->fetch()) {
                // User exists in exco_users, update their information
                $excoUpdateFields = [];
                $excoParams = [];
                
                // Map users table fields to exco_users table fields
                if (isset($input['name'])) {
                    $excoUpdateFields[] = "name = ?";
                    $excoParams[] = $input['name'];
                }
                if (isset($input['email'])) {
                    $excoUpdateFields[] = "email = ?";
                    $excoParams[] = $input['email'];
                }
                if (isset($input['phone'])) {
                    $excoUpdateFields[] = "phone = ?";
                    $excoParams[] = $input['phone'];
                }
                if (isset($input['location'])) {
                    $excoUpdateFields[] = "department = ?";
                    $excoParams[] = $input['location'];
                }
                
                if (!empty($excoUpdateFields)) {
                    $excoParams[] = $updatedUser['email']; // for WHERE clause
                    $excoSql = "UPDATE exco_users SET " . implode(', ', $excoUpdateFields) . " WHERE email = ?";
                    $stmt = $pdo->prepare($excoSql);
                    $stmt->execute($excoParams);
                    
                    error_log("EXCO Users table updated for user: " . $updatedUser['email']);
                }
            }
        } catch (Exception $e) {
            // Don't fail the main operation if EXCO users update fails
            error_log("EXCO Users update failed: " . $e->getMessage());
        }
    }
    
    // Also notify admin about user profile update (if not admin updating their own profile)
    if ($userId != 1) { // Assuming admin user ID is 1
        try {
            $stmt = $pdo->prepare("SELECT name, email FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $userInfo = $stmt->fetch();
            
            if ($userInfo) {
                $stmt = $pdo->prepare("
                    INSERT INTO notifications (user_id, title, message, type, is_read, created_at) 
                    VALUES (?, ?, ?, ?, 0, NOW())
                ");
                $stmt->execute([
                    null, // System-wide notification for admin
                    "User Profile Updated",
                    "User '{$userInfo['name']}' ({$userInfo['email']}) has updated their profile information.",
                    'info'
                ]);
            }
        } catch (Exception $e) {
            // Don't fail the main operation if admin notification fails
            error_log("Admin notification failed: " . $e->getMessage());
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'User profile updated successfully',
        'user' => $updatedUser
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 