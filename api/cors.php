<?php
// CORS configuration for frontend requests
// Allow both localhost (development) and InfinityFree domain (production)
$allowedOrigins = [
    'http://localhost:5173',
    'https://exco.kesug.com',
    'https://*.infinityfreeapp.com',
    'https://*.epizy.com'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins) || 
    preg_match('/^https:\/\/.*\.infinityfreeapp\.com$/', $origin) ||
    preg_match('/^https:\/\/.*\.epizy\.com$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?> 