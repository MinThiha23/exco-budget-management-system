<?php
require_once 'config.php';

// CORS handled centrally in config.php

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$filename = $_GET['file'] ?? '';

if (empty($filename)) {
    http_response_code(400);
    echo json_encode(['error' => 'No file specified']);
    exit();
}

// Security: prevent directory traversal
$filename = basename($filename);
$filepath = 'uploads/' . $filename;

if (!file_exists($filepath)) {
    http_response_code(404);
    echo json_encode(['error' => 'File not found']);
    exit();
}

// Get file info
$fileInfo = pathinfo($filepath);
$extension = strtolower($fileInfo['extension']);

// Set appropriate content type
$contentTypes = [
    'pdf' => 'application/pdf',
    'doc' => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls' => 'application/vnd.ms-excel',
    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

$contentType = $contentTypes[$extension] ?? 'application/octet-stream';

// Set headers for file download
header('Content-Type: ' . $contentType);
header('Content-Disposition: inline; filename="' . $filename . '"');
header('Content-Length: ' . filesize($filepath));
header('Cache-Control: no-cache, must-revalidate');
header('Pragma: no-cache');

// Output file
readfile($filepath);
?> 