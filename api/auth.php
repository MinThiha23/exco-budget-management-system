<?php
require_once 'config.php';

// Ensure JSON responses even on errors
header('Content-Type: application/json');
set_exception_handler(function ($e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error',
    ]);
});
set_error_handler(function ($severity, $message, $file, $line) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error',
    ]);
    return true;
});

// Lightweight probe to verify this script executes
if (isset($_GET['test']) && $_GET['test'] === '1') {
    echo json_encode(['success' => true, 'probe' => 'auth.php alive']);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    if ($method === 'POST') {
        $action = $input['action'] ?? '';
        if ($action === 'login') {
            login($input);
        } elseif ($action === 'logout') {
            logout();
        } elseif ($action === 'validate_session') {
            validateSession($input);
        } else {
            sendError('Invalid action', 400);
        }
    } else {
        sendError('Method not allowed', 405);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Unhandled server error']);
}

function login($data) {
    if (!isset($data['email']) || !isset($data['password'])) {
        sendError('Email and password required', 400);
    }

    $pdo = getConnection();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch();

    if ($user) {
        // Check if password matches using password_verify for all users
        if (password_verify($data['password'], $user['password'])) {
            // Remove password from response
            unset($user['password']);
            
            // Sessions disabled on InfinityFree for stability; frontend stores auth state

            // Log the login activity using global logger from config.php
            logActivity($user['id'], 'login', json_encode(['email' => $user['email'], 'role' => $user['role']]));
            
            sendResponse([
                'success' => true,
                'message' => 'Login successful',
                'user' => $user
            ]);
        } else {
            sendError('Invalid email or password', 401);
        }
    } else {
        sendError('Invalid email or password', 401);
    }
}

function logout() {
    // No server session; client clears its own storage
    sendResponse([
        'success' => true,
        'message' => 'Logout successful'
    ]);
}

function validateSession($data) {
    if (!isset($data['user_id'])) {
        sendError('User ID required', 400);
    }

    $pdo = getConnection();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ? AND is_active = 1");
    $stmt->execute([$data['user_id']]);
    $user = $stmt->fetch();

    if ($user) {
        // Remove password from response
        unset($user['password']);
        
        sendResponse([
            'success' => true,
            'message' => 'Session valid',
            'user' => $user
        ]);
    } else {
        sendError('Invalid session', 401);
    }
}

// Using global logActivity(userId, action, details) from config.php
?>