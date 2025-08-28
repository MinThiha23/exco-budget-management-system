<?php
require_once 'config.php';

// Content-Type header (CORS handled centrally in config.php)
header('Content-Type: application/json');

try {
    $pdo = getConnection();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getExcoUsers();
            break;
        case 'PUT':
            updateExcoUser();
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("EXCO Users API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function getExcoUsers() {
    global $pdo;
    
    try {
        // First, check if the table exists
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'exco_users'");
        if ($tableCheck->rowCount() == 0) {
            echo json_encode([
                'success' => false, 
                'error' => 'Table exco_users does not exist',
                'excoUsers' => []
            ]);
            return;
        }
        
        // Check if table has any data
        $countCheck = $pdo->query("SELECT COUNT(*) as count FROM exco_users");
        $count = $countCheck->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($count == 0) {
            echo json_encode([
                'success' => true, 
                'message' => 'No EXCO users found in database',
                'excoUsers' => []
            ]);
            return;
        }
        
        // Join with users table to get profile photos
        $stmt = $pdo->query("
            SELECT 
                eu.*,
                u.avatar as profile_photo
            FROM exco_users eu
            LEFT JOIN users u ON eu.email = u.email
            ORDER BY eu.id ASC
        ");
        $excoUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process the data to use profile photos when available
        foreach ($excoUsers as &$user) {
            // If user has a profile photo, use it; otherwise fall back to EXCO image
            if (!empty($user['profile_photo'])) {
                $user['image_url'] = $user['profile_photo'];
            }
            // Remove the profile_photo field as it's redundant
            unset($user['profile_photo']);
        }
        
        echo json_encode(['success' => true, 'excoUsers' => $excoUsers]);
    } catch (Exception $e) {
        error_log("Error fetching EXCO users: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to fetch EXCO users: ' . $e->getMessage(),
            'excoUsers' => []
        ]);
    }
}

function updateExcoUser() {
    global $pdo;
    
    try {
        // Get the request body
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['email'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email is required']);
            return;
        }
        
        $email = $input['email'];
        $updates = $input['updates'] ?? [];
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No updates provided']);
            return;
        }
        
        // Build the update query dynamically
        $setClause = [];
        $params = [];
        
        foreach ($updates as $field => $value) {
            if (in_array($field, ['name', 'email', 'phone', 'department', 'image_url'])) {
                $setClause[] = "$field = ?";
                $params[] = $value;
            }
        }
        
        if (empty($setClause)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields to update']);
            return;
        }
        
        $params[] = $email; // for WHERE clause
        
        $sql = "UPDATE exco_users SET " . implode(', ', $setClause) . " WHERE email = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'EXCO user updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'No changes made or user not found']);
        }
        
    } catch (Exception $e) {
        error_log("Error updating EXCO user: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update EXCO user']);
    }
}
?> 