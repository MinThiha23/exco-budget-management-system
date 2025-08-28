<?php
require_once 'config.php';

try {
    $pdo = getConnection();
    
    // Check if program_queries table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'program_queries'");
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        echo "ERROR: program_queries table does not exist!\n";
        exit(1);
    }
    
    // Check if programs table exists and has data
    $stmt = $pdo->query("SELECT COUNT(*) FROM programs");
    $programCount = $stmt->fetchColumn();
    
    echo "SUCCESS: Database connection working\n";
    echo "program_queries table exists: " . ($tableExists ? 'YES' : 'NO') . "\n";
    echo "programs table has " . $programCount . " records\n";
    
    // Check if users table has finance users
$stmt = $pdo->query("SELECT id, name, role FROM users WHERE role = 'Finance MMK'");
    $financeUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Finance users found: " . count($financeUsers) . "\n";
    foreach ($financeUsers as $user) {
        echo "- ID: " . $user['id'] . ", Name: " . $user['name'] . ", Role: " . $user['role'] . "\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?> 