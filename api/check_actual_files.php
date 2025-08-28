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
    
    // Get the specific program document
    $stmt = $pdo->prepare("SELECT id, title, documents FROM programs WHERE documents LIKE '%Surat Kelulusan Pkn(57).pdf%' LIMIT 1");
    $stmt->execute();
    $program = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Check what directories exist and what files are in them
    $dirs_to_check = [
        'uploads',
        'files', 
        'documents',
        '../uploads',
        '../files',
        '../documents'
    ];
    
    $directory_contents = [];
    foreach ($dirs_to_check as $dir) {
        $full_path = __DIR__ . '/' . $dir;
        if (is_dir($full_path)) {
            $files = scandir($full_path);
            // Filter out . and .. and show only PDF files
            $pdf_files = array_filter($files, function($file) {
                return $file !== '.' && $file !== '..' && pathinfo($file, PATHINFO_EXTENSION) === 'pdf';
            });
            $directory_contents[$dir] = [
                'path' => $full_path,
                'exists' => true,
                'pdf_files' => array_values($pdf_files)
            ];
        } else {
            $directory_contents[$dir] = [
                'path' => $full_path,
                'exists' => false,
                'pdf_files' => []
            ];
        }
    }
    
    // Also check document root
    $doc_root = $_SERVER['DOCUMENT_ROOT'] ?? 'Not available';
    $doc_root_dirs = [];
    if ($doc_root !== 'Not available') {
        foreach (['uploads', 'files', 'documents'] as $dir) {
            $full_path = $doc_root . '/' . $dir;
            if (is_dir($full_path)) {
                $files = scandir($full_path);
                $pdf_files = array_filter($files, function($file) {
                    return $file !== '.' && $file !== '..' && pathinfo($file, PATHINFO_EXTENSION) === 'pdf';
                });
                $doc_root_dirs[$dir] = [
                    'path' => $full_path,
                    'exists' => true,
                    'pdf_files' => array_values($pdf_files)
                ];
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'program_data' => $program,
        'current_script_dir' => __DIR__,
        'document_root' => $doc_root,
        'directory_contents' => $directory_contents,
        'document_root_dirs' => $doc_root_dirs,
        'server_info' => [
            'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Not available',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Not available'
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
