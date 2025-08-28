<?php
require_once 'config.php';

// Content-Type header (CORS handled centrally in config.php)
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Check if file was uploaded
    if (!isset($_FILES['profile_photo']) || $_FILES['profile_photo']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error');
    }

    $file = $_FILES['profile_photo'];
    $fileName = $file['name'];
    $fileSize = $file['size'];
    $fileTmpName = $file['tmp_name'];
    $fileType = $file['type'];

    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!in_array($fileType, $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPG, PNG, and GIF are allowed.');
    }

    // Validate file size (max 5MB)
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($fileSize > $maxSize) {
        throw new Exception('File size too large. Maximum size is 5MB.');
    }

    // Create profile photos directory if it doesn't exist
    $uploadDir = 'profile_photos/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
    $uniqueName = 'profile_' . uniqid() . '.' . $fileExtension;
    $filePath = $uploadDir . $uniqueName;

    // Move uploaded file
    if (move_uploaded_file($fileTmpName, $filePath)) {
        // Get user ID from request (you might want to get this from session)
        $userId = $_POST['user_id'] ?? null;
        
        if ($userId) {
            // Update user's profile photo in database
            $pdo = getConnection();
            
            // First, get the user's email to find the corresponding EXCO user
            $stmt = $pdo->prepare("SELECT email FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && $user['email']) {
                // Update users table
                $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
                $stmt->execute([$filePath, $userId]);
                
                // Also update exco_users table if this user exists there
                $stmt = $pdo->prepare("UPDATE exco_users SET image_url = ? WHERE email = ?");
                $stmt->execute([$filePath, $user['email']]);
            } else {
                // Just update users table if no email found
                $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
                $stmt->execute([$filePath, $userId]);
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Profile photo uploaded successfully',
            'file' => [
                'originalName' => $fileName,
                'storedName' => $uniqueName,
                'path' => $filePath,
                'size' => $fileSize,
                'type' => $fileType
            ]
        ]);
    } else {
        throw new Exception('Failed to move uploaded file');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?> 