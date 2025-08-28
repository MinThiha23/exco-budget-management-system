<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Simple file check
$filename = '68a5430f87fc9_Surat Akuan Pusat Khidmat(56).pdf';

echo json_encode([
    'success' => true,
    'message' => 'Script is working',
    'filename' => $filename,
    'current_dir' => __DIR__,
    'parent_dir' => dirname(__DIR__),
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Not available',
    'server_name' => $_SERVER['SERVER_NAME'] ?? 'Not available',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Not available'
]);
?>
