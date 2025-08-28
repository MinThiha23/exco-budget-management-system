<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['program_id'])) {
            getProgramApprovals($_GET['program_id']);
        } else {
            getAllApprovals();
        }
        break;
    case 'POST':
        createApproval($input);
        break;
    case 'PUT':
        if (isset($_GET['id'])) {
            updateApproval($_GET['id'], $input);
        } else {
            sendError('Approval ID required', 400);
        }
        break;
    case 'DELETE':
        if (isset($_GET['id'])) {
            deleteApproval($_GET['id']);
        } else {
            sendError('Approval ID required', 400);
        }
        break;
    default:
        sendError('Method not allowed', 405);
}

function getAllApprovals() {
    $pdo = getConnection();
    
    $stmt = $pdo->query("
        SELECT pa.*, p.title as program_title, p.status as program_status,
               u1.name as approver_name, u2.name as submitted_by_name
        FROM program_approvals pa
        LEFT JOIN programs p ON pa.program_id = p.id
        LEFT JOIN users u1 ON pa.approver_id = u1.id
        LEFT JOIN users u2 ON p.user_id = u2.id
        ORDER BY pa.created_at DESC
    ");
    $approvals = $stmt->fetchAll();
    
    sendResponse($approvals);
}

function getProgramApprovals($programId) {
    $pdo = getConnection();
    
    // Check if program exists
    $stmt = $pdo->prepare("SELECT id, title FROM programs WHERE id = ?");
    $stmt->execute([$programId]);
    $program = $stmt->fetch();
    
    if (!$program) {
        sendError('Program not found', 404);
    }
    
    $stmt = $pdo->prepare("
        SELECT pa.*, u.name as approver_name
        FROM program_approvals pa
        LEFT JOIN users u ON pa.approver_id = u.id
        WHERE pa.program_id = ?
        ORDER BY pa.created_at DESC
    ");
    $stmt->execute([$programId]);
    $approvals = $stmt->fetchAll();
    
    $response = [
        'program' => $program,
        'approvals' => $approvals
    ];
    
    sendResponse($response);
}

function createApproval($data) {
    validateRequired($data, ['program_id', 'approver_id']);
    
    $pdo = getConnection();
    
    // Check if program exists
    $stmt = $pdo->prepare("SELECT id, status FROM programs WHERE id = ?");
    $stmt->execute([$data['program_id']]);
    $program = $stmt->fetch();
    
    if (!$program) {
        sendError('Program not found', 404);
    }
    
    // Check if approver exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$data['approver_id']]);
    if (!$stmt->fetch()) {
        sendError('Approver not found', 404);
    }
    
    // Check if approval already exists for this program and approver
    $stmt = $pdo->prepare("SELECT id FROM program_approvals WHERE program_id = ? AND approver_id = ?");
    $stmt->execute([$data['program_id'], $data['approver_id']]);
    if ($stmt->fetch()) {
        sendError('Approval already exists for this program and approver', 409);
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO program_approvals (program_id, approver_id, status, comments)
        VALUES (?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['program_id'],
        $data['approver_id'],
        $data['status'] ?? 'pending',
        $data['comments'] ?? null
    ]);
    
    $approvalId = $pdo->lastInsertId();
    
    // Get the created approval
    $stmt = $pdo->prepare("
        SELECT pa.*, u.name as approver_name
        FROM program_approvals pa
        LEFT JOIN users u ON pa.approver_id = u.id
        WHERE pa.id = ?
    ");
    $stmt->execute([$approvalId]);
    $approval = $stmt->fetch();
    
    sendResponse($approval, 201);
}

function updateApproval($id, $data) {
    $pdo = getConnection();
    
    // Check if approval exists
    $stmt = $pdo->prepare("SELECT id, program_id FROM program_approvals WHERE id = ?");
    $stmt->execute([$id]);
    $approval = $stmt->fetch();
    
    if (!$approval) {
        sendError('Approval not found', 404);
    }
    
    $updateFields = [];
    $params = [];
    
    if (isset($data['status'])) {
        if (!in_array($data['status'], ['pending', 'approved', 'rejected'])) {
            sendError('Status must be pending, approved, or rejected', 400);
        }
        $updateFields[] = "status = ?";
        $params[] = $data['status'];
        
        // If approved or rejected, set approved_at timestamp
        if (in_array($data['status'], ['approved', 'rejected'])) {
            $updateFields[] = "approved_at = CURRENT_TIMESTAMP";
        }
    }
    
    if (isset($data['comments'])) {
        $updateFields[] = "comments = ?";
        $params[] = $data['comments'];
    }
    
    if (empty($updateFields)) {
        sendError('No fields to update', 400);
    }
    
    $params[] = $id;
    $sql = "UPDATE program_approvals SET " . implode(', ', $updateFields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Update program status based on approval
    if (isset($data['status'])) {
        updateProgramStatus($approval['program_id'], $data['status']);
    }
    
    // Get updated approval
    $stmt = $pdo->prepare("
        SELECT pa.*, u.name as approver_name
        FROM program_approvals pa
        LEFT JOIN users u ON pa.approver_id = u.id
        WHERE pa.id = ?
    ");
    $stmt->execute([$id]);
    $approval = $stmt->fetch();
    
    sendResponse($approval);
}

function updateProgramStatus($programId, $approvalStatus) {
    $pdo = getConnection();
    
    // Get all approvals for this program
    $stmt = $pdo->prepare("SELECT status FROM program_approvals WHERE program_id = ?");
    $stmt->execute([$programId]);
    $approvals = $stmt->fetchAll();
    
    // Determine program status based on approvals
    $allApproved = true;
    $anyRejected = false;
    
    foreach ($approvals as $approval) {
        if ($approval['status'] === 'rejected') {
            $anyRejected = true;
        } elseif ($approval['status'] !== 'approved') {
            $allApproved = false;
        }
    }
    
    $newProgramStatus = 'pending';
    if ($anyRejected) {
        $newProgramStatus = 'rejected';
    } elseif ($allApproved && count($approvals) > 0) {
        $newProgramStatus = 'approved';
    }
    
    // Update program status
    $stmt = $pdo->prepare("UPDATE programs SET status = ? WHERE id = ?");
    $stmt->execute([$newProgramStatus, $programId]);
}

function deleteApproval($id) {
    $pdo = getConnection();
    
    // Check if approval exists
    $stmt = $pdo->prepare("SELECT id FROM program_approvals WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        sendError('Approval not found', 404);
    }
    
    $stmt = $pdo->prepare("DELETE FROM program_approvals WHERE id = ?");
    $stmt->execute([$id]);
    
    sendResponse(['success' => true, 'message' => 'Approval deleted successfully']);
}
?> 