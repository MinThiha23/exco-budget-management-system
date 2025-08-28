<?php
require_once 'config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $pdo = getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Simple GET request - fetch all users
        $stmt = $pdo->query("SELECT id, name, email, role, phone, location, is_active, created_at FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'users' => $users,
            'count' => count($users)
        ]);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle POST requests for create/update/delete
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['action'])) {
            echo json_encode(['success' => false, 'error' => 'Action required']);
            exit;
        }
        
        switch ($input['action']) {
            case 'create':
                // Create new user
                if (!isset($input['name']) || !isset($input['email']) || !isset($input['password']) || !isset($input['role'])) {
                    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
                    exit;
                }
                
                $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $input['name'],
                    $input['email'],
                    password_hash($input['password'], PASSWORD_DEFAULT),
                    $input['role'],
                    $input['phone'] ?? null,
                    $input['location'] ?? null
                ]);
                
                echo json_encode(['success' => true, 'message' => 'User created successfully']);
                break;
                
            case 'update':
                // Update existing user
                if (!isset($input['id'])) {
                    echo json_encode(['success' => false, 'error' => 'User ID required']);
                    exit;
                }
                
                $updateFields = [];
                $params = [];
                
                if (isset($input['name'])) {
                    $updateFields[] = "name = ?";
                    $params[] = $input['name'];
                }
                if (isset($input['email'])) {
                    $updateFields[] = "email = ?";
                    $params[] = $input['email'];
                }
                if (isset($input['role'])) {
                    $updateFields[] = "role = ?";
                    $params[] = $input['role'];
                }
                if (isset($input['phone'])) {
                    $updateFields[] = "phone = ?";
                    $params[] = $input['phone'];
                }
                if (isset($input['location'])) {
                    $updateFields[] = "location = ?";
                    $params[] = $input['location'];
                }
                if (isset($input['is_active'])) {
                    $updateFields[] = "is_active = ?";
                    $params[] = $input['is_active'] ? 1 : 0;
                }
                
                if (empty($updateFields)) {
                    echo json_encode(['success' => false, 'error' => 'No fields to update']);
                    exit;
                }
                
                $params[] = $input['id'];
                $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                
                echo json_encode(['success' => true, 'message' => 'User updated successfully']);
                break;
                
            case 'delete':
                // Delete user
                if (!isset($input['id'])) {
                    echo json_encode(['success' => false, 'error' => 'User ID required']);
                    exit;
                }
                
                $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
                $stmt->execute([$input['id']]);
                
                echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
                break;
                
            default:
                echo json_encode(['success' => false, 'error' => 'Invalid action']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
