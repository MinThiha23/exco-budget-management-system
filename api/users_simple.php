<?php
require_once 'config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple helper functions
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'error' => $message
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($method) {
    case 'GET':
        getUsers();
        break;
    case 'POST':
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'create':
                    createUser($input);
                    break;
                case 'update':
                    if (isset($input['id'])) {
                        updateUser($input['id'], $input);
                    } else {
                        sendError('User ID required', 400);
                    }
                    break;
                case 'delete':
                    if (isset($input['id'])) {
                        deleteUser($input['id']);
                    } else {
                        sendError('User ID required', 400);
                    }
                    break;
                default:
                    sendError('Invalid action', 400);
            }
        } else {
            sendError('Action required', 400);
        }
        break;
    default:
        sendError('Method not allowed', 405);
}

function getUsers() {
    try {
        $pdo = getConnection();
        
        $stmt = $pdo->query("SELECT id, name, email, role, phone, location, is_active, created_at FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll();
        
        sendResponse([
            'success' => true,
            'users' => $users
        ]);
    } catch (Exception $e) {
        sendError('Database error: ' . $e->getMessage(), 500);
    }
}

function createUser($data) {
    try {
        $pdo = getConnection();
        
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['email'],
            password_hash($data['password'], PASSWORD_DEFAULT),
            $data['role'],
            $data['phone'] ?? null,
            $data['location'] ?? null
        ]);
        
        sendResponse([
            'success' => true,
            'message' => 'User created successfully'
        ]);
    } catch (Exception $e) {
        sendError('Error creating user: ' . $e->getMessage(), 500);
    }
}

function updateUser($id, $data) {
    try {
        $pdo = getConnection();
        
        $updateFields = [];
        $params = [];
        
        if (isset($data['name'])) {
            $updateFields[] = "name = ?";
            $params[] = $data['name'];
        }
        
        if (isset($data['email'])) {
            $updateFields[] = "email = ?";
            $params[] = $data['email'];
        }
        
        if (isset($data['role'])) {
            $updateFields[] = "role = ?";
            $params[] = $data['role'];
        }
        
        if (isset($data['phone'])) {
            $updateFields[] = "phone = ?";
            $params[] = $data['phone'];
        }
        
        if (isset($data['location'])) {
            $updateFields[] = "location = ?";
            $params[] = $data['location'];
        }
        
        if (isset($data['is_active'])) {
            $updateFields[] = "is_active = ?";
            $params[] = $data['is_active'] ? 1 : 0;
        }
        
        if (empty($updateFields)) {
            sendError('No fields to update', 400);
        }
        
        $params[] = $id;
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        sendResponse([
            'success' => true,
            'message' => 'User updated successfully'
        ]);
    } catch (Exception $e) {
        sendError('Error updating user: ' . $e->getMessage(), 500);
    }
}

function deleteUser($id) {
    try {
        $pdo = getConnection();
        
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        
        sendResponse([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    } catch (Exception $e) {
        sendError('Error deleting user: ' . $e->getMessage(), 500);
    }
}
?>
