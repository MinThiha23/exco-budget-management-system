<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Get filename from request or use default
$filename = $_GET['file'] ?? '68a5430f87fc9_Surat Akuan Pusat Khidmat(56).pdf';

// Search in multiple possible locations
$searchPaths = [
    // Relative to current script
    __DIR__ . '/uploads/' . $filename,
    __DIR__ . '/files/' . $filename,
    __DIR__ . '/documents/' . $filename,
    
    // Relative to parent directory
    dirname(__DIR__) . '/uploads/' . $filename,
    dirname(__DIR__) . '/files/' . $filename,
    dirname(__DIR__) . '/documents/' . $filename,
    
    // Relative to document root
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/uploads/' . $filename,
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/files/' . $filename,
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/documents/' . $filename,
    
    // Relative to document root + api
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/api/uploads/' . $filename,
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/api/files/' . $filename,
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/api/documents/' . $filename,
    
    // Absolute paths
    '/uploads/' . $filename,
    '/files/' . $filename,
    '/documents/' . $filename,
    '/api/uploads/' . $filename,
    '/api/files/' . $filename,
    '/api/documents/' . $filename
];

$results = [];
$foundFiles = [];

foreach ($searchPaths as $path) {
    $exists = file_exists($path);
    $readable = $exists ? is_readable($path) : false;
    $size = $exists ? filesize($path) : 0;
    
    $results[] = [
        'path' => $path,
        'exists' => $exists,
        'readable' => $readable,
        'size' => $size
    ];
    
    if ($exists) {
        $foundFiles[] = $path;
    }
}

// Also check what directories exist
$dirsToCheck = [
    __DIR__,
    dirname(__DIR__),
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/uploads',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/files',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/documents',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/api/uploads',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/api/files',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/api/documents'
];

$directoryInfo = [];
foreach ($dirsToCheck as $dir) {
    if (is_dir($dir)) {
        $contents = scandir($dir);
        $directoryInfo[$dir] = [
            'exists' => true,
            'contents' => array_slice($contents, 0, 20), // First 20 items
            'count' => count($contents)
        ];
    } else {
        $directoryInfo[$dir] = [
            'exists' => false,
            'contents' => [],
            'count' => 0
        ];
    }
}

echo json_encode([
    'success' => true,
    'filename' => $filename,
    'search_results' => $results,
    'found_files' => $foundFiles,
    'directory_info' => $directoryInfo,
    'current_script_dir' => __DIR__,
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Not available',
    'server_info' => [
        'server_name' => $_SERVER['SERVER_NAME'] ?? 'Not available',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Not available',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Not available'
    ]
], JSON_PRETTY_PRINT);
?>
