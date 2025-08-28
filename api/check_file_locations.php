<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Check various possible file locations
$filename = '68a5430f87fc9_Surat Akuan Pusat Khidmat(56).pdf';

$possiblePaths = [
    'uploads/' . $filename,
    'api/uploads/' . $filename,
    'files/' . $filename,
    'api/files/' . $filename,
    'documents/' . $filename,
    'api/documents/' . $filename,
    '../uploads/' . $filename,
    '../files/' . $filename,
    '../documents/' . $filename,
    'storage/' . $filename,
    'api/storage/' . $filename,
    'public/uploads/' . $filename,
    'public/files/' . $filename
];

$results = [];

foreach ($possiblePaths as $path) {
    $fullPath = __DIR__ . '/' . $path;
    $exists = file_exists($fullPath);
    
    $results[] = [
        'path' => $path,
        'full_path' => $fullPath,
        'exists' => $exists,
        'is_readable' => $exists ? is_readable($fullPath) : false,
        'size' => $exists ? filesize($fullPath) : 0
    ];
}

// Also check what directories exist
$directories = [];
$baseDirs = [
    __DIR__,
    dirname(__DIR__),
    dirname(__DIR__) . '/uploads',
    dirname(__DIR__) . '/files',
    dirname(__DIR__) . '/documents'
];

foreach ($baseDirs as $dir) {
    if (is_dir($dir)) {
        $directories[$dir] = scandir($dir);
    }
}

echo json_encode([
    'success' => true,
    'filename' => $filename,
    'current_directory' => __DIR__,
    'parent_directory' => dirname(__DIR__),
    'file_checks' => $results,
    'directory_listings' => $directories,
    'server_document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Not available'
], JSON_PRETTY_PRINT);
?>
