<?php
/**
 * Production Configuration for InfinityFree Hosting
 * 
 * IMPORTANT: Update these values with your actual InfinityFree credentials
 * You can find these in your InfinityFree control panel under "MySQL Databases"
 */

// Database Configuration
define('DB_HOST', 'sql308.infinityfree.com');        // Your actual host
define('DB_NAME', 'if0_39600694_EXCO');             // Your actual database name
define('DB_USER', 'if0_39600694');                  // Your actual username
define('DB_PASS', '235203mth');                     // Your password

// Production Environment
define('ENVIRONMENT', 'production');
define('DEBUG_MODE', false);

// CORS Configuration - Development and Production
define('ALLOWED_ORIGINS', [
    'http://localhost:3000',           // React dev server
    'http://localhost:5173',           // Vite dev server
    'http://localhost:8080',           // Common dev port
    'https://exco.kesug.com',          // Production
    'http://exco.kesug.com',           // Production HTTP
    'https://*.infinityfreeapp.com',   // InfinityFree
    'https://*.epizy.com',             // Epizy
    'https://*.rf.gd',                 // RF.GD
    'https://*.000webhostapp.com'      // 000WebHost
]);

// IMPORTANT: Copy the contents of this file to replace api/config.php before uploading

// File Upload Configuration
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB (InfinityFree limit)
define('UPLOAD_DIR', 'uploads/');
define('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']);

// Security Configuration
define('SESSION_TIMEOUT', 3600); // 1 hour
define('PASSWORD_MIN_LENGTH', 8);
define('LOGIN_ATTEMPTS_LIMIT', 5);

// API Rate Limiting
define('RATE_LIMIT_REQUESTS', 100); // requests per hour
define('RATE_LIMIT_WINDOW', 3600); // 1 hour

// Error Reporting (disable for production)
if (ENVIRONMENT === 'production') {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', 'error.log');
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Timezone
date_default_timezone_set('Asia/Kuala_Lumpur'); // Malaysia timezone

// Database Connection Function
function getConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        // Ensure MySQL session timezone is set for every connection
        try {
            $pdo->exec("SET time_zone = '+08:00'"); // Asia/Kuala_Lumpur (UTC+8)
        } catch (Throwable $tzErr) {
            // Fallback: ignore if the host forbids SET time_zone
        }
        return $pdo;
    } catch (PDOException $e) {
        if (ENVIRONMENT === 'production') {
            error_log("Database connection failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
        } else {
            // Development mode - show detailed error
            error_log("Database connection failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'error' => 'Database connection failed',
                'details' => $e->getMessage(),
                'host' => DB_HOST,
                'database' => DB_NAME,
                'user' => DB_USER
            ]);
        }
        exit;
    }
}

// Ensure MySQL session timezone is set to Malaysia time (UTC+8)
try {
    $tmpPdo = isset($GLOBALS['pdo_timezone_check']) ? null : getConnection();
    if ($tmpPdo) {
        $tmpPdo->exec("SET time_zone = '+08:00'");
        $GLOBALS['pdo_timezone_check'] = true;
    }
} catch (Throwable $ignore) {
    // If this fails, we still proceed; times default to server timezone
}

// CORS Headers
function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400'); // 24 hours
    
    // Handle preflight OPTIONS request
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Utility Functions
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
}

function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode(['error' => $message]);
}

function validateRequired($data, $requiredFields) {
    $missing = [];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 400);
        exit();
    }
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

// Rate Limiting
function checkRateLimit($userId) {
    // Simple rate limiting implementation
    $cacheFile = "rate_limit_{$userId}.txt";
    $currentTime = time();
    
    if (file_exists($cacheFile)) {
        $data = json_decode(file_get_contents($cacheFile), true);
        if ($data && $currentTime - $data['timestamp'] < RATE_LIMIT_WINDOW) {
            if ($data['count'] >= RATE_LIMIT_REQUESTS) {
                return false; // Rate limit exceeded
            }
            $data['count']++;
        } else {
            $data = ['timestamp' => $currentTime, 'count' => 1];
        }
    } else {
        $data = ['timestamp' => $currentTime, 'count' => 1];
    }
    
    file_put_contents($cacheFile, json_encode($data));
    return true;
}

// File Upload Validation
function validateFileUpload($file) {
    $errors = [];
    
    if ($file['size'] > MAX_FILE_SIZE) {
        $errors[] = "File size exceeds " . (MAX_FILE_SIZE / 1024 / 1024) . "MB limit";
    }
    
    $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($fileExtension, ALLOWED_FILE_TYPES)) {
        $errors[] = "File type not allowed. Allowed types: " . implode(', ', ALLOWED_FILE_TYPES);
    }
    
    return $errors;
}

// Logging Function
function logActivity($userId, $action, $details = '') {
    if (ENVIRONMENT === 'production') {
        $logEntry = date('Y-m-d H:i:s') . " | User: $userId | Action: $action | Details: $details\n";
        file_put_contents('activity.log', $logEntry, FILE_APPEND | LOCK_EX);
    }
}

// Initialize CORS
setCorsHeaders();

// Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

?>
