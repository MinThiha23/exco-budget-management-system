<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Database connection
$host = 'localhost';
$dbname = 'kesugCha_exco';
$username = 'kesugCha_exco';
$password = 'exco@KESUG2024';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get all programs with documents
    $stmt = $pdo->prepare("SELECT id, title, documents FROM programs WHERE documents IS NOT NULL AND documents != '' LIMIT 10");
    $stmt->execute();
    $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check what directories exist
    $dirs_to_check = [
        'uploads',
        'files',
        'documents',
        'storage',
        '../uploads',
        '../files', 
        '../documents',
        'public/uploads',
        'public/files'
    ];
    
    $directory_status = [];
    foreach ($dirs_to_check as $dir) {
        $full_path = __DIR__ . '/' . $dir;
        $exists = is_dir($full_path);
        $contents = [];
        
        if ($exists) {
            $files = scandir($full_path);
            $contents = array_slice($files, 0, 10); // First 10 files
        }
        
        $directory_status[$dir] = [
            'exists' => $exists,
            'path' => $full_path,
            'contents' => $contents
        ];
    }
    
    echo json_encode([
        'success' => true,
        'programs_with_docs' => $programs,
        'directory_status' => $directory_status,
        'current_dir' => __DIR__,
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Not available'
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
