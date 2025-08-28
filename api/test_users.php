<?php
require_once 'config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

try {
    $pdo = getConnection();
    
    // Check if users table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'users'");
    $tableExists = $tableCheck->rowCount() > 0;
    
    if (!$tableExists) {
        echo json_encode([
            'success' => false,
            'error' => 'Users table does not exist',
            'tables' => $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN)
        ]);
        exit;
    }
    
    // Count total users
    $countStmt = $pdo->query("SELECT COUNT(*) as total FROM users");
    $totalUsers = $countStmt->fetch()['total'];
    
    // Get sample users (first 5)
    $stmt = $pdo->query("SELECT id, name, email, role, phone, location, is_active, created_at FROM users ORDER BY created_at DESC LIMIT 5");
    $users = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'tableExists' => $tableExists,
        'totalUsers' => $totalUsers,
        'sampleUsers' => $users,
        'database' => DB_NAME,
        'host' => DB_HOST
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>
