<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

try {
    $pdo = getConnection();
    
    // Get all programs with their submitted_by values
    $stmt = $pdo->query("SELECT id, title, submitted_by, status, created_at FROM programs ORDER BY created_at DESC");
    $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get all EXCO users
    $stmt = $pdo->query("SELECT id, name, portfolio FROM exco_users ORDER BY name");
    $excoUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'programs' => $programs,
        'exco_users' => $excoUsers,
        'total_programs' => count($programs),
        'total_exco_users' => count($excoUsers)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 