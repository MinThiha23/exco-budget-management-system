<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['user_id'])) {
            getUserActivity($_GET['user_id']);
        } else {
            getAllActivity();
        }
        break;
    case 'POST':
        logActivity($input);
        break;
    default:
        sendError('Method not allowed', 405);
}

function getAllActivity() {
    $pdo = getConnection();
    
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    $stmt = $pdo->prepare("
        SELECT al.*, u.name as user_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([$limit, $offset]);
    $activities = $stmt->fetchAll();
    
    // Parse JSON details
    foreach ($activities as &$activity) {
        $activity['details'] = json_decode($activity['details'] ?? '{}', true);
    }
    
    sendResponse($activities);
}

function getUserActivity($userId) {
    $pdo = getConnection();
    
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id, name FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendError('User not found', 404);
    }
    
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    $stmt = $pdo->prepare("
        SELECT al.*, u.name as user_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.user_id = ?
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([$userId, $limit, $offset]);
    $activities = $stmt->fetchAll();
    
    // Parse JSON details
    foreach ($activities as &$activity) {
        $activity['details'] = json_decode($activity['details'] ?? '{}', true);
    }
    
    $response = [
        'user' => $user,
        'activities' => $activities
    ];
    
    sendResponse($response);
}

function logActivity($data) {
    validateRequired($data, ['action']);
    
    $pdo = getConnection();
    
    $stmt = $pdo->prepare("
        INSERT INTO activity_logs (user_id, action, table_name, record_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['user_id'] ?? null,
        $data['action'],
        $data['table_name'] ?? null,
        $data['record_id'] ?? null,
        json_encode($data['details'] ?? []),
        $_SERVER['REMOTE_ADDR'] ?? null
    ]);
    
    $activityId = $pdo->lastInsertId();
    
    // Get the created activity log
    $stmt = $pdo->prepare("
        SELECT al.*, u.name as user_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.id = ?
    ");
    $stmt->execute([$activityId]);
    $activity = $stmt->fetch();
    
    // Parse JSON details
    $activity['details'] = json_decode($activity['details'] ?? '{}', true);
    
    sendResponse($activity, 201);
}

// Utility function to log activity from other files
function logUserActivity($userId, $action, $tableName = null, $recordId = null, $details = []) {
    $pdo = getConnection();
    
    $stmt = $pdo->prepare("
        INSERT INTO activity_logs (user_id, action, table_name, record_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $userId,
        $action,
        $tableName,
        $recordId,
        json_encode($details),
        $_SERVER['REMOTE_ADDR'] ?? null
    ]);
    
    return $pdo->lastInsertId();
}
?> 