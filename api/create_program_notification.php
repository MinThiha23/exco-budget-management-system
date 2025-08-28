<?php
require_once 'config.php';

function createProgramNotification($userId, $title, $message, $type = 'info') {
    try {
        $pdo = getConnection();
        
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, is_read, created_at) 
            VALUES (?, ?, ?, ?, 0, NOW())
        ");
        
        $result = $stmt->execute([$userId, $title, $message, $type]);
        
        if ($result) {
            error_log("Notification created: $title for user $userId");
            return true;
        } else {
            error_log("Failed to create notification: $title for user $userId");
            return false;
        }
    } catch (Exception $e) {
        error_log("Error creating notification: " . $e->getMessage());
        return false;
    }
}

function createSystemNotification($title, $message, $type = 'info') {
    return createProgramNotification(null, $title, $message, $type);
}

// Example usage functions
// $userId should be the program creator/owner, not the user making the request
function notifyProgramCreated($programId, $userId, $performedByRole = 'user', $performedByUserId = null) {
    try {
        $pdo = getConnection();
        $stmt = $pdo->prepare("SELECT title FROM programs WHERE id = ?");
        $stmt->execute([$programId]);
        $program = $stmt->fetch();
        $programTitle = $program ? $program['title'] : 'Program';
        
        $title = "New Program Created";
        $message = "Your program '$programTitle' has been successfully created and is now in draft status.";
        $userResult = createProgramNotification($userId, $title, $message, 'success');
        
        // Get the username if user ID is provided
        $username = '';
        if ($performedByUserId) {
            $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
            $stmt->execute([$performedByUserId]);
            $user = $stmt->fetch();
            if ($user) {
                $username = " (" . $user['name'] . ")";
            }
        }
        
        // Also notify admin about new program creation
        $adminResult = createSystemNotification(
            "New Program Created by " . ucfirst($performedByRole), 
            "A new program '$programTitle' has been created by a " . $performedByRole . $username . " and requires review."
        );
        
        return $userResult && $adminResult;
    } catch (Exception $e) {
        error_log("Error in notifyProgramCreated: " . $e->getMessage());
        return false;
    }
}

function notifyProgramSubmitted($programId, $userId) {
    try {
        $pdo = getConnection();
        $stmt = $pdo->prepare("SELECT title FROM programs WHERE id = ?");
        $stmt->execute([$programId]);
        $program = $stmt->fetch();
        $programTitle = $program ? $program['title'] : 'Program';
        
        $title = "Program Submitted";
        $message = "Your program '$programTitle' has been submitted for finance review.";
        $userResult = createProgramNotification($userId, $title, $message, 'info');
        
    // Notify finance users about submitted program
    $financeStmt = $pdo->prepare("SELECT id FROM users WHERE role IN ('Finance MMK', 'finance_officer')");
        $financeStmt->execute();
        $financeUsers = $financeStmt->fetchAll();
        
        $financeResult = true;
        foreach ($financeUsers as $financeUser) {
            $result = createProgramNotification(
                $financeUser['id'],
                "Program Submitted for Review",
                "A new program '$programTitle' has been submitted for finance review.",
                'warning'
            );
            $financeResult = $financeResult && $result;
        }
        
        return $userResult && $financeResult;
    } catch (Exception $e) {
        error_log("Error in notifyProgramSubmitted: " . $e->getMessage());
        return false;
    }
}

// $userId should be the program owner, not the user making the request
function notifyProgramUpdated($programId, $userId, $performedByRole = 'user', $performedByUserId = null) {
    try {
        $pdo = getConnection();
        $stmt = $pdo->prepare("SELECT title FROM programs WHERE id = ?");
        $stmt->execute([$programId]);
        $program = $stmt->fetch();
        $programTitle = $program ? $program['title'] : 'Program';
        
        $title = "Program Updated";
        $message = "Your program '$programTitle' has been successfully updated.";
        $userResult = createProgramNotification($userId, $title, $message, 'info');
        
        // Get the username if user ID is provided
        $username = '';
        if ($performedByUserId) {
            $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
            $stmt->execute([$performedByUserId]);
            $user = $stmt->fetch();
            if ($user) {
                $username = " (" . $user['name'] . ")";
            }
        }
        
        // Also notify admin about program update
        $adminResult = createSystemNotification(
            "Program Updated by " . ucfirst($performedByRole), 
            "A program '$programTitle' has been updated by a " . $performedByRole . $username . "."
        );
        
        return $userResult && $adminResult;
    } catch (Exception $e) {
        error_log("Error in notifyProgramUpdated: " . $e->getMessage());
        return false;
    }
}

function notifyProgramStatusChanged($programId, $newStatus, $userId, $performedByRole = 'user', $performedByUserId = null) {
    try {
        $pdo = getConnection();
        $stmt = $pdo->prepare("SELECT title FROM programs WHERE id = ?");
        $stmt->execute([$programId]);
        $program = $stmt->fetch();
        $programTitle = $program ? $program['title'] : 'Program';
        
        $title = "Program Status Changed";
        $message = "Your program '$programTitle' status has been changed to '$newStatus'.";
        $type = $newStatus === 'approved' ? 'success' : ($newStatus === 'rejected' ? 'error' : 'warning');
        $userResult = createProgramNotification($userId, $title, $message, $type);
        
        // Get the username if user ID is provided
        $username = '';
        if ($performedByUserId) {
            $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
            $stmt->execute([$performedByUserId]);
            $user = $stmt->fetch();
            if ($user) {
                $username = " (" . $user['name'] . ")";
            }
        }
        
        // Also notify admin about status change
        $adminResult = createSystemNotification(
            "Program Status Changed by " . ucfirst($performedByRole), 
            "Program '$programTitle' status has been changed to '$newStatus' by a " . $performedByRole . $username . "."
        );
        
        return $userResult && $adminResult;
    } catch (Exception $e) {
        error_log("Error in notifyProgramStatusChanged: " . $e->getMessage());
        return false;
    }
}

function notifyBudgetAllocation($amount, $userId) {
    $title = "Budget Allocation";
    $message = "A new budget allocation of RM " . number_format($amount, 2) . " has been assigned to your programs.";
    return createProgramNotification($userId, $title, $message, 'info');
}

// Test function
if (isset($_GET['test'])) {
    $testUserId = 2; // user1exco@gmail.com
    
    // Test different notification types
    notifyProgramCreated("Test Program", $testUserId);
    notifyProgramStatusChanged("Test Program", "approved", $testUserId);
    notifyBudgetAllocation(50000, $testUserId);
    createSystemNotification("System Maintenance", "Scheduled maintenance will occur tonight at 2:00 AM.");
    
    echo json_encode([
        'success' => true,
        'message' => 'Test notifications created successfully'
    ]);
}
?> 