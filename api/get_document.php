<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get the filename from the request
$filename = $_GET['file'] ?? '';

if (empty($filename)) {
    http_response_code(400);
    echo json_encode(['error' => 'No filename provided']);
    exit;
}

// Database connection to find the actual stored filename
$host = 'localhost';
$dbname = 'kesugCha_exco';
$username = 'kesugCha_exco';
$password = 'exco@KESUG2024';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Search for the file in the database
    $stmt = $pdo->prepare("SELECT documents FROM programs WHERE documents LIKE ?");
    $search_pattern = '%' . $filename . '%';
    $stmt->execute([$search_pattern]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result && $result['documents']) {
        $documents = json_decode($result['documents'], true);
        if (is_array($documents)) {
            foreach ($documents as $doc) {
                if (is_array($doc) && isset($doc['originalName']) && $doc['originalName'] === $filename) {
                    $filename = $doc['storedName']; // Use the actual stored filename
                    break;
                } elseif (is_string($doc) && strpos($doc, $filename) !== false) {
                    $filename = $doc; // Use the full stored filename
                    break;
                }
            }
        } else {
            // If documents is a string, check if it contains our filename
            if (strpos($result['documents'], $filename) !== false) {
                $filename = $result['documents']; // Use the full stored filename
            }
        }
    }
    
} catch (Exception $e) {
    // If database fails, continue with original filename
    error_log("Database error in get_document.php: " . $e->getMessage());
}

// Define possible file locations
$possible_paths = [
    // Relative to current script
    __DIR__ . '/uploads/' . $filename,
    __DIR__ . '/files/' . $filename,
    __DIR__ . '/documents/' . $filename,
    __DIR__ . '/storage/' . $filename,
    
    // Relative to parent directory
    __DIR__ . '/../uploads/' . $filename,
    __DIR__ . '/../files/' . $filename,
    __DIR__ . '/../documents/' . $filename,
    __DIR__ . '/../storage/' . $filename,
    
    // Relative to grandparent directory
    __DIR__ . '/../../uploads/' . $filename,
    __DIR__ . '/../../files/' . $filename,
    __DIR__ . '/../../documents/' . $filename,
    __DIR__ . '/../../storage/' . $filename,
    
    // Document root paths
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/uploads/' . $filename,
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/files/' . $filename,
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/documents/' . $filename,
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/storage/' . $filename,
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/api/uploads/' . $filename,
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/api/files/' . $filename,
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/api/documents/' . $filename,
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/api/storage/' . $filename,
    
    // Public paths
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/public/uploads/' . $filename,
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/public/files/' . $filename,
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/public/documents/' . $filename,
    
    // Absolute paths (common hosting setups)
    '/home/vol15_1/infinityfree.com/if0_39600694/htdocs/uploads/' . $filename,
    '/home/vol15_1/infinityfree.com/if0_39600694/htdocs/files/' . $filename,
    '/home/vol15_1/infinityfree.com/if0_39600694/htdocs/documents/' . $filename,
    '/home/vol15_1/infinityfree.com/if0_39600694/htdocs/storage/' . $filename
];

// Find the file
$found_file = null;
foreach ($possible_paths as $path) {
    if (file_exists($path) && is_readable($path)) {
        $found_file = $path;
        break;
    }
}

if (!$found_file) {
    http_response_code(404);
    echo json_encode([
        'error' => 'File not found',
        'filename' => $filename,
        'searched_paths' => $possible_paths,
        'debug_info' => [
            'current_dir' => __DIR__,
            'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Not available',
            'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Not available',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Not available'
        ]
    ]);
    exit;
}

// Get file info
$file_info = pathinfo($found_file);
$file_extension = strtolower($file_info['extension']);

// Set appropriate headers based on file type
$mime_types = [
    'pdf' => 'application/pdf',
    'doc' => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls' => 'application/vnd.ms-excel',
    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt' => 'application/vnd.ms-powerpoint',
    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
    'txt' => 'text/plain'
];

$content_type = $mime_types[$file_extension] ?? 'application/octet-stream';

// Set headers for file display
header('Content-Type: ' . $content_type);
header('Content-Length: ' . filesize($found_file));
header('Content-Disposition: inline; filename="' . basename($filename) . '"');
header('Cache-Control: public, max-age=3600');

// Output the file
readfile($found_file);
exit;
?>
