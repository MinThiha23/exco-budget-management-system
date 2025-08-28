<?php
require_once 'config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

try {
    $pdo = getConnection();
    
    // First, let's check what tables already exist
    $existingTables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    
    // Check if users table exists
    $usersTableExists = in_array('users', $existingTables);
    
    if ($usersTableExists) {
        // Check if users exist
        $countStmt = $pdo->query("SELECT COUNT(*) as total FROM users");
        $totalUsers = $countStmt->fetch()['total'];
        
        // If no users exist, create some demo users
        if ($totalUsers == 0) {
            // Create admin user
            $adminStmt = $pdo->prepare("
                INSERT INTO users (name, email, password, role, phone, location, is_active, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $adminStmt->execute([
                'System Admin',
                'admin@kesug.com',
                password_hash('admin123', PASSWORD_DEFAULT),
                'admin',
                '0123456789',
                'Kedah State Government',
                1
            ]);
            
            // Create EXCO user
            $excoStmt = $pdo->prepare("
                INSERT INTO users (name, email, password, role, phone, location, is_active, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $excoStmt->execute([
                'EXCO User Demo',
                'exco@kesug.com',
                password_hash('exco123', PASSWORD_DEFAULT),
                'user',
                '0123456790',
                'Kedah State Government',
                1
            ]);
            
            // Create Finance MMK user
            $financeStmt = $pdo->prepare("
                INSERT INTO users (name, email, password, role, phone, location, is_active, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $financeStmt->execute([
                'Finance MMK Demo',
                'finance@kesug.com',
                password_hash('finance123', PASSWORD_DEFAULT),
                'finance',
                '0123456791',
                'Kedah State Government',
                1
            ]);
            
            $totalUsers = 3;
        }
        
        // Get all users
        $stmt = $pdo->query("SELECT id, name, email, role, phone, location, is_active, created_at FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'message' => 'Users table exists and has data',
            'existingTables' => $existingTables,
            'usersTableExists' => $usersTableExists,
            'totalUsers' => $totalUsers,
            'users' => $users,
            'database' => DB_NAME,
            'host' => DB_HOST
        ]);
    } else {
        // Users table doesn't exist, let's create it
        $createTableSQL = "
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'manager', 'coordinator', 'user', 'finance', 'finance_officer', 'super_admin') NOT NULL DEFAULT 'user',
            phone VARCHAR(20),
            location VARCHAR(255),
            avatar VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        
        $pdo->exec($createTableSQL);
        
        // Now create demo users
        $adminStmt = $pdo->prepare("
            INSERT INTO users (name, email, password, role, phone, location, is_active, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $adminStmt->execute([
            'System Admin',
            'admin@kesug.com',
            password_hash('admin123', PASSWORD_DEFAULT),
            'admin',
            '0123456789',
            'Kedah State Government',
            1
        ]);
        
        $excoStmt = $pdo->prepare("
            INSERT INTO users (name, email, password, role, phone, location, is_active, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $excoStmt->execute([
            'EXCO User Demo',
            'exco@kesug.com',
            password_hash('exco123', PASSWORD_DEFAULT),
            'user',
            '0123456790',
            'Kedah State Government',
            1
        ]);
        
        $financeStmt = $pdo->prepare("
            INSERT INTO users (name, email, password, role, phone, location, is_active, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $financeStmt->execute([
            'Finance MMK Demo',
            'finance@kesug.com',
            password_hash('finance123', PASSWORD_DEFAULT),
            'finance',
            '0123456791',
            'Kedah State Government',
            1
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Users table created and demo users added',
            'existingTables' => $existingTables,
            'usersTableExists' => true,
            'totalUsers' => 3,
            'database' => DB_NAME,
            'host' => DB_HOST
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>
