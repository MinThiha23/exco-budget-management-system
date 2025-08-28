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
    // Check if files were uploaded
    if (!isset($_FILES['documents']) || empty($_FILES['documents']['name'][0])) {
        http_response_code(400);
        echo json_encode(['error' => 'No files uploaded']);
        exit();
    }

    $uploadedFiles = [];
    $errors = [];
    
    // Create uploads directory if it doesn't exist
    $uploadDir = 'uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Process each uploaded file
    foreach ($_FILES['documents']['tmp_name'] as $key => $tmpName) {
        $fileName = $_FILES['documents']['name'][$key];
        $fileSize = $_FILES['documents']['size'][$key];
        $fileError = $_FILES['documents']['error'][$key];
        
        // Check for upload errors
        if ($fileError !== UPLOAD_ERR_OK) {
            $errors[] = "Error uploading $fileName: " . $fileError;
            continue;
        }
        
        // Validate file size (10MB limit)
        if ($fileSize > 10 * 1024 * 1024) {
            $errors[] = "$fileName is too large. Maximum size is 10MB.";
            continue;
        }
        
        // Validate file type
        $allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        if (!in_array($fileExtension, $allowedTypes)) {
            $errors[] = "$fileName has an invalid file type. Allowed types: " . implode(', ', $allowedTypes);
            continue;
        }
        
        // Generate unique filename
        $uniqueName = uniqid() . '_' . $fileName;
        $filePath = $uploadDir . $uniqueName;
        
        // Move uploaded file
        if (move_uploaded_file($tmpName, $filePath)) {
            $uploadedFiles[] = [
                'originalName' => $fileName,
                'storedName' => $uniqueName,
                'path' => $filePath,
                'size' => $fileSize,
                'fullData' => [
                    'originalName' => $fileName,
                    'storedName' => $uniqueName,
                    'size' => $fileSize
                ]
            ];
        } else {
            $errors[] = "Failed to save $fileName";
        }
    }
    
    // Return response
    if (empty($uploadedFiles)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'No files were successfully uploaded',
            'details' => $errors
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'files' => $uploadedFiles,
            'errors' => $errors
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?> 