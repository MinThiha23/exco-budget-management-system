<?php
require_once 'config.php';

// Content-Type header (CORS handled centrally in config.php)
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    $pdo = getConnection();
    
    // Update the email address
    $stmt = $pdo->prepare("UPDATE users SET email = ? WHERE email = ?");
    $result = $stmt->execute(['user1exco@gmail.com', 'user@exco@gmail.com']);
    
    if ($result) {
        $affectedRows = $stmt->rowCount();
        
        // Verify the update
        $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE email = ?");
        $stmt->execute(['user1exco@gmail.com']);
        $user = $stmt->fetch();
        
        echo json_encode([
            'success' => true,
            'message' => 'Email updated successfully',
            'affectedRows' => $affectedRows,
            'updatedUser' => $user
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to update email'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?> 