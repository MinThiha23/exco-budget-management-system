<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    echo json_encode([
        'status' => 'Testing database connection...',
        'config' => [
            'host' => DB_HOST,
            'database' => DB_NAME,
            'user' => DB_USER,
            'environment' => ENVIRONMENT
        ]
    ]);
    
    $pdo = getConnection();
    
    if ($pdo) {
        echo json_encode([
            'status' => 'SUCCESS',
            'message' => 'Database connection successful!',
            'connection_info' => [
                'host' => DB_HOST,
                'database' => DB_NAME,
                'user' => DB_USER
            ]
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'ERROR',
        'message' => 'Database connection failed',
        'error' => $e->getMessage(),
        'config' => [
            'host' => DB_HOST,
            'database' => DB_NAME,
            'user' => DB_USER,
            'environment' => ENVIRONMENT
        ]
    ]);
}
?> 