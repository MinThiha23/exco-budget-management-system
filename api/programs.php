<?php
require_once 'config.php';
require_once 'create_program_notification.php';

// Content-Type header
header('Content-Type: application/json');

// Helper function to parse JSON fields in programs
function parseProgramJsonFields(&$program) {
    if (isset($program['documents']) && is_string($program['documents'])) {
        $program['documents'] = json_decode($program['documents'], true) ?: [];
    }
    if (isset($program['budget_breakdown']) && is_string($program['budget_breakdown'])) {
        $program['budget_breakdown'] = json_decode($program['budget_breakdown'], true) ?: [];
    }
    if (isset($program['timeline']) && is_string($program['timeline'])) {
        $program['timeline'] = json_decode($program['timeline'], true) ?: [];
    }
}

try {
    $pdo = getConnection();

$method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

// For POST requests, also check the request body for action
if ($method === 'POST') {
    $rawBody = file_get_contents('php://input');
    $postData = json_decode($rawBody, true);
    if (isset($postData['action'])) {
        $action = $postData['action'];
    } elseif (isset($_POST['action'])) {
        // Support multipart/form-data or application/x-www-form-urlencoded
        $action = $_POST['action'];
    }
}

// Debug logging
error_log("Request method: $method, Action: '$action'");
error_log("POST data: " . file_get_contents('php://input'));

switch ($method) {
    case 'GET':
            if ($action === 'updateField') {
                updateProgramField();
            } elseif (isset($_GET['id'])) {
                getProgram($_GET['id']);
            } elseif ($action === 'getUserQueries') {
                getUserQueries();
            } elseif ($action === 'getFinanceQueries') {
                getFinanceQueries();
            } elseif ($action === 'getFinancePrograms') {
                getFinancePrograms();
            } elseif ($action === 'getUserProgramsByEmail') {
                getUserProgramsByEmail();
            } elseif ($action === 'getDocumentHistory') {
                // inline handler to avoid function placement issues
                try {
                    $programId = $_GET['program_id'] ?? null;
                    $category = $_GET['category'] ?? null;
                    if (!$programId || !$category) {
                        http_response_code(400);
                        echo json_encode(['error' => 'Program ID and category required']);
                    } else {
                        // Ensure table exists (best-effort)
                        try {
                            $pdo->exec("CREATE TABLE IF NOT EXISTS document_history (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                program_id INT NOT NULL,
                                category VARCHAR(255) NOT NULL,
                                original_name VARCHAR(255) NOT NULL,
                                stored_name VARCHAR(255) NOT NULL,
                                uploaded_by INT NULL,
                                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                INDEX(program_id), INDEX(category)
                            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
                        } catch (Exception $e) {}

                        $stmtDH = $pdo->prepare("SELECT dh.*, u.name as uploaded_by_name
                                                 FROM document_history dh
                                                 LEFT JOIN users u ON dh.uploaded_by = u.id
                                                 WHERE dh.program_id = ? AND dh.category = ?
                                                 ORDER BY dh.uploaded_at ASC, dh.id ASC");
                        $stmtDH->execute([$programId, $category]);
                        $rows = $stmtDH->fetchAll(PDO::FETCH_ASSOC);
                        $versioned = [];
                        foreach ($rows as $index => $row) {
                            $row['version'] = $index + 1;
                            $versioned[] = $row;
                        }
                        echo json_encode(['success' => true, 'history' => $versioned]);
                    }
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to fetch document history']);
                }
            } elseif ($action === 'generateReport') {
                generateProgramReport();
            } elseif ($action === 'generateBulkReport') {
                generateBulkReport();
            } elseif (isset($_GET['user_id'])) {
            getUserPrograms($_GET['user_id']);
            } elseif (isset($_GET['finance']) && $_GET['finance'] === 'true') {
                getFinancePrograms();
        } else {
            getAllPrograms();
        }
        break;
            
    case 'POST':
            error_log("POST action: '$action'");
            if ($action === 'submit') {
                submitProgram();
            } elseif ($action === 'createQuery') {
                createQuery();
            } elseif ($action === 'answerQuery') {
                answerQuery();
            } elseif ($action === 'approveProgram') {
                approveProgram();
            } elseif ($action === 'rejectProgram') {
                rejectProgram();
            } elseif ($action === 'acceptDocument') {
                acceptDocument();
            } elseif ($action === 'deductBudget') {
                deductBudget();
            } elseif ($action === 'addRemark') {
                error_log("Calling addRemark function");
                addRemark();
            } elseif ($action === 'update') {
                // Allow POST-based updates to avoid hosts that block PUT
                updateProgram();
            } elseif ($action === 'updateField') {
                updateProgramField();
            } elseif ($action === 'generateBulkReport') {
                generateBulkReport();
        } else {
                error_log("No matching action found, calling createProgram");
                createProgram();
        }
        break;
            
        case 'PUT':
            updateProgram();
            break;
            
    case 'DELETE':
            deleteProgram();
        break;
            
    default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    error_log("Programs API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function getAllPrograms() {
    global $pdo;
    
    try {
    $stmt = $pdo->query("
            SELECT p.*, u.name as user_name, u.role as user_role,
                   a.name as approver_name, r.name as rejector_name
        FROM programs p 
        LEFT JOIN users u ON p.user_id = u.id 
            LEFT JOIN users a ON p.approved_by = a.id
            LEFT JOIN users r ON p.rejected_by = r.id
        ORDER BY p.created_at DESC
    ");
        
        $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Parse JSON fields and fetch additional data for each program
    foreach ($programs as &$program) {
            parseProgramJsonFields($program);
            
            // Get queries for this program
            $queryStmt = $pdo->prepare("
                SELECT pq.*, u1.name as queried_by_name, u2.name as answered_by_name
                FROM program_queries pq
                LEFT JOIN users u1 ON pq.queried_by = u1.id
                LEFT JOIN users u2 ON pq.answered_by = u2.id
                WHERE pq.program_id = ?
                ORDER BY pq.query_date DESC
            ");
            $queryStmt->execute([$program['id']]);
            $program['queries'] = $queryStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get remarks for this program
            $remarkStmt = $pdo->prepare("
                SELECT pr.*, u.name as remarked_by_name
                FROM program_remarks pr
                LEFT JOIN users u ON pr.remarked_by = u.id
                WHERE pr.program_id = ?
                ORDER BY pr.remark_date DESC
            ");
            $remarkStmt->execute([$program['id']]);
            $program['remarks'] = $remarkStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get budget deductions for this program
            $deductionStmt = $pdo->prepare("
                SELECT bd.*, u.name as deducted_by_name
                FROM budget_deductions bd
                LEFT JOIN users u ON bd.deducted_by = u.id
                WHERE bd.program_id = ?
                ORDER BY bd.deduction_date DESC
            ");
            $deductionStmt->execute([$program['id']]);
            $program['budget_deductions'] = $deductionStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode(['success' => true, 'programs' => $programs]);
        
    } catch (Exception $e) {
        error_log("Error fetching programs: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch programs']);
    }
}

function getUserPrograms($userId) {
    global $pdo;
    
    try {
    $stmt = $pdo->prepare("
            SELECT p.*, u.name as user_name, u.role as user_role,
                   a.name as approver_name, r.name as rejector_name
        FROM programs p 
        LEFT JOIN users u ON p.user_id = u.id 
            LEFT JOIN users a ON p.approved_by = a.id
            LEFT JOIN users r ON p.rejected_by = r.id
        WHERE p.user_id = ? 
        ORDER BY p.created_at DESC
    ");
        
    $stmt->execute([$userId]);
        $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Parse JSON fields and fetch additional data for each program
    foreach ($programs as &$program) {
            parseProgramJsonFields($program);
            
            // Get queries for this program
            $queryStmt = $pdo->prepare("
                SELECT pq.*, u1.name as queried_by_name, u2.name as answered_by_name
                FROM program_queries pq
                LEFT JOIN users u1 ON pq.queried_by = u1.id
                LEFT JOIN users u2 ON pq.answered_by = u2.id
                WHERE pq.program_id = ?
                ORDER BY pq.query_date DESC
            ");
            $queryStmt->execute([$program['id']]);
            $program['queries'] = $queryStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get remarks for this program
            $remarkStmt = $pdo->prepare("
                SELECT pr.*, u.name as remarked_by_name
                FROM program_remarks pr
                LEFT JOIN users u ON pr.remarked_by = u.id
                WHERE pr.program_id = ?
                ORDER BY pr.remark_date DESC
            ");
            $remarkStmt->execute([$program['id']]);
            $program['remarks'] = $remarkStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get budget deductions for this program
            $deductionStmt = $pdo->prepare("
                SELECT bd.*, u.name as deducted_by_name
                FROM budget_deductions bd
                LEFT JOIN users u ON bd.deducted_by = u.id
                WHERE bd.program_id = ?
                ORDER BY bd.deduction_date DESC
            ");
            $deductionStmt->execute([$program['id']]);
            $program['budget_deductions'] = $deductionStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode(['success' => true, 'programs' => $programs]);
        
    } catch (Exception $e) {
        error_log("Error fetching user programs: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch user programs']);
    }
}

function getFinancePrograms() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("
            SELECT p.*, u.name as user_name, u.role as user_role,
                   a.name as approver_name, r.name as rejector_name
            FROM programs p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN users a ON p.approved_by = a.id
            LEFT JOIN users r ON p.rejected_by = r.id
            WHERE p.status IN ('submitted', 'queried', 'answered_query', 'approved', 'rejected', 'budget_deducted')
            ORDER BY p.created_at DESC
        ");
        
        $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON fields and fetch additional data for each program
        foreach ($programs as &$program) {
            parseProgramJsonFields($program);
            
            // Get queries for this program
            $queryStmt = $pdo->prepare("
                SELECT pq.*, u1.name as queried_by_name, u2.name as answered_by_name
                FROM program_queries pq
                LEFT JOIN users u1 ON pq.queried_by = u1.id
                LEFT JOIN users u2 ON pq.answered_by = u2.id
                WHERE pq.program_id = ?
                ORDER BY pq.query_date DESC
            ");
            $queryStmt->execute([$program['id']]);
            $program['queries'] = $queryStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get remarks for this program
            $remarkStmt = $pdo->prepare("
                SELECT pr.*, u.name as remarked_by_name
                FROM program_remarks pr
                LEFT JOIN users u ON pr.remarked_by = u.id
                WHERE pr.program_id = ?
                ORDER BY pr.remark_date DESC
            ");
            $remarkStmt->execute([$program['id']]);
            $program['remarks'] = $remarkStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get budget deductions for this program
            $deductionStmt = $pdo->prepare("
                SELECT bd.*, u.name as deducted_by_name
                FROM budget_deductions bd
                LEFT JOIN users u ON bd.deducted_by = u.id
                WHERE bd.program_id = ?
                ORDER BY bd.deduction_date DESC
            ");
            $deductionStmt->execute([$program['id']]);
            $program['budget_deductions'] = $deductionStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode(['success' => true, 'programs' => $programs]);
        
    } catch (Exception $e) {
        error_log("Error fetching finance programs: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch finance programs']);
    }
}

function getProgram($id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT p.*, u.name as user_name, u.role as user_role,
                   a.name as approver_name, r.name as rejector_name
            FROM programs p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN users a ON p.approved_by = a.id
            LEFT JOIN users r ON p.rejected_by = r.id
            WHERE p.id = ?
        ");
        
        $stmt->execute([$id]);
        $program = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$program) {
            http_response_code(404);
            echo json_encode(['error' => 'Program not found']);
            return;
        }
        
        parseProgramJsonFields($program);
        
        // Get queries for this program
        $queryStmt = $pdo->prepare("
            SELECT pq.*, u1.name as queried_by_name, u2.name as answered_by_name
            FROM program_queries pq
            LEFT JOIN users u1 ON pq.queried_by = u1.id
            LEFT JOIN users u2 ON pq.answered_by = u2.id
            WHERE pq.program_id = ?
            ORDER BY pq.query_date DESC
        ");
        $queryStmt->execute([$id]);
        $program['queries'] = $queryStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get remarks for this program
        $remarkStmt = $pdo->prepare("
            SELECT pr.*, u.name as remarked_by_name
            FROM program_remarks pr
            LEFT JOIN users u ON pr.remarked_by = u.id
            WHERE pr.program_id = ?
            ORDER BY pr.remark_date DESC
        ");
        $remarkStmt->execute([$id]);
        $program['remarks'] = $remarkStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get budget deductions for this program
        $deductionStmt = $pdo->prepare("
            SELECT bd.*, u.name as deducted_by_name
            FROM budget_deductions bd
            LEFT JOIN users u ON bd.deducted_by = u.id
            WHERE bd.program_id = ?
            ORDER BY bd.deduction_date DESC
        ");
        $deductionStmt->execute([$id]);
        $program['budget_deductions'] = $deductionStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'program' => $program]);
        
    } catch (Exception $e) {
        error_log("Error fetching program: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch program']);
    }
}

function createProgram() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validate required fields - Only Letter Reference Number is mandatory
        if (empty($data['letter_reference_number'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Letter reference number is required']);
            return;
        }

        // Documents are now optional - no validation required
        $documentsArr = [];
        if (isset($data['documents'])) {
            if (is_string($data['documents'])) {
                $decoded = json_decode($data['documents'], true);
                $documentsArr = $decoded !== null ? $decoded : [];
            } elseif (is_array($data['documents'])) {
                $documentsArr = $data['documents'];
            }
        }
    
    $stmt = $pdo->prepare("
            INSERT INTO programs (title, description, department, recipient_name, budget, 
                                 start_date, end_date, letter_reference_number, user_id, submitted_by, objectives, kpi_data, documents)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $objectives = is_array($data['objectives']) ? json_encode($data['objectives']) : $data['objectives'];
        $kpiData = is_array($data['kpi_data']) ? json_encode($data['kpi_data']) : $data['kpi_data'];
        $documents = is_array($data['documents']) ? json_encode($data['documents']) : $data['documents'];
    
    $stmt->execute([
        $data['title'],
        $data['description'],
            $data['department'],
        $data['recipient_name'],
        $data['budget'],
            $data['start_date'],
            $data['end_date'],
        $data['letter_reference_number'] ?? '',
        $data['user_id'],
            $data['submitted_by'],
            $objectives,
            $kpiData,
            $documents
    ]);
    
    $programId = $pdo->lastInsertId();

        // Persist initial document history rows (version 1) if categories provided
        try {
            $pdo->exec("CREATE TABLE IF NOT EXISTS document_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                program_id INT NOT NULL,
                category VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                stored_name VARCHAR(255) NOT NULL,
                uploaded_by INT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX(program_id), INDEX(category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
            $docs = is_array($documentsArr) ? $documentsArr : json_decode((string)$documents, true);
            if (is_array($docs)) {
                                        $ins = $pdo->prepare("INSERT INTO document_history (program_id, category, original_name, stored_name, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, NOW())");
                        foreach ($docs as $doc) {
                            if (is_array($doc) && isset($doc['storedName'])) {
                                $ins->execute([$programId, $doc['category'] ?? 'Uncategorized', $doc['originalName'] ?? '', $doc['storedName'], $data['user_id'] ?? null]);
                            }
                        }
            }
        } catch (Exception $e) {
            // best-effort; ignore failures
        }
    
    // Get the created program
        $stmt = $pdo->prepare("SELECT * FROM programs WHERE id = ?");
        $stmt->execute([$programId]);
        $program = $stmt->fetch(PDO::FETCH_ASSOC);
        
        parseProgramJsonFields($program);
        
        // Get creating user role for notification
        $userStmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $userStmt->execute([$data['user_id']]);
        $creatingUserRole = $userStmt->fetchColumn();
        
        // Notify admin about new program
        notifyProgramCreated($programId, $data['user_id'], $creatingUserRole, $data['user_id']);
        
        echo json_encode([
            'success' => true, 
            'program' => $program, 
            'message' => 'Program created successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Error creating program: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create program']);
    }
}

function submitProgram() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
    $stmt = $pdo->prepare("
            UPDATE programs 
            SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, submitted_by = ?
            WHERE id = ? AND user_id = ?
        ");
        
        $result = $stmt->execute([$data['submitted_by'], $data['program_id'], $data['user_id']]);
        
        if ($result && $stmt->rowCount() > 0) {
            // Get program details for notification
            $programStmt = $pdo->prepare("SELECT * FROM programs WHERE id = ?");
            $programStmt->execute([$data['program_id']]);
            $program = $programStmt->fetch(PDO::FETCH_ASSOC);
            
            // Notify finance about submitted program
            notifyProgramSubmitted($data['program_id'], $data['user_id']);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Program submitted successfully for finance review'
            ]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Failed to submit program']);
        }
        
    } catch (Exception $e) {
        error_log("Error submitting program: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to submit program']);
    }
}

function createQuery() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Map frontend field names to backend expectations
        $programId = $data['programId'] ?? $data['program_id'];
        $queryText = $data['query'] ?? $data['query_text'];
        
        // Get the finance user ID from the request or default to 1
        $queriedBy = $data['queried_by'] ?? 1; // Default to finance user ID 1
        
        if (!$programId || !$queryText) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: programId and query']);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO program_queries (program_id, queried_by, query_text)
            VALUES (?, ?, ?)
        ");
        
        // First check if the program exists
        $checkStmt = $pdo->prepare("SELECT id, user_id, status FROM programs WHERE id = ?");
        $checkStmt->execute([$programId]);
        $program = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$program) {
            http_response_code(404);
            echo json_encode(['error' => 'Program not found']);
            return;
        }
        
        $stmt->execute([$programId, $queriedBy, $queryText]);
        
        // Update program status to queried
        $updateStmt = $pdo->prepare("
            UPDATE programs SET status = 'queried' WHERE id = ?
        ");
        $updateStmt->execute([$programId]);
        
        $programUserId = $program['user_id'];
        
        // Notify user about query (don't fail if notification fails)
        try {
            createProgramNotification(
                $programUserId,
                'Program Query',
                'Your program has been queried by finance. Please check and respond.',
                'warning'
            );
        } catch (Exception $e) {
            error_log("Failed to create notification for query: " . $e->getMessage());
            // Don't fail the query creation if notification fails
        }
        
        echo json_encode([
            'success' => true, 
            'message' => 'Query created successfully',
            'query_id' => $pdo->lastInsertId()
        ]);
        
    } catch (Exception $e) {
        error_log("Error creating query: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create query: ' . $e->getMessage()]);
    }
}

function answerQuery() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Map frontend field names to backend expectations
        $queryId = $data['queryId'] ?? $data['query_id'];
        $answerText = $data['answerText'] ?? $data['answer_text'];
        
        // Get current user from session or request
        session_start();
        $answeredBy = $_SESSION['user_id'] ?? $data['answered_by'] ?? 1;
        
        if (!$queryId || !$answerText) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: queryId and answerText']);
            return;
        }
        
        // Get program_id from the query
        $queryStmt = $pdo->prepare("SELECT program_id, queried_by FROM program_queries WHERE id = ?");
        $queryStmt->execute([$queryId]);
        $queryData = $queryStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$queryData) {
            http_response_code(404);
            echo json_encode(['error' => 'Query not found']);
            return;
        }
        
        $programId = $queryData['program_id'];
        $queriedBy = $queryData['queried_by'];
        
        $stmt = $pdo->prepare("
            UPDATE program_queries 
            SET answer_text = ?, answered_by = ?, answered_at = CURRENT_TIMESTAMP, status = 'answered'
            WHERE id = ?
        ");
        
        $stmt->execute([$answerText, $answeredBy, $queryId]);
        
        // Update program status to answered_query
        $updateStmt = $pdo->prepare("
            UPDATE programs SET status = 'answered_query' WHERE id = ?
        ");
        $updateStmt->execute([$programId]);
        
        // Notify finance about answered query
        createProgramNotification(
            $queriedBy,
            'Query Answered',
            'A program query has been answered. Please review.',
            'info'
        );
        
        echo json_encode([
            'success' => true, 
            'message' => 'Query answered successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Error answering query: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to answer query: ' . $e->getMessage()]);
    }
}

function approveProgram() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Map frontend field names to backend expectations
        $programId = $data['programId'] ?? $data['program_id'];
        $voucherNumber = $data['voucherNumber'] ?? $data['voucher_number'];
        $eftNumber = $data['eftNumber'] ?? $data['eft_number'];
        $approvedBy = $data['approved_by'] ?? 1; // Default to finance user ID 1
        
        if (!$programId || !$voucherNumber || !$eftNumber) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: programId, voucherNumber, and eftNumber']);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE programs 
            SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP,
                voucher_number = ?, eft_number = ?
            WHERE id = ?
        ");
        
        $result = $stmt->execute([
            $approvedBy,
            $voucherNumber,
            $eftNumber,
            $programId
        ]);
        
        if ($result && $stmt->rowCount() > 0) {
            // Get program details
            $programStmt = $pdo->prepare("SELECT user_id FROM programs WHERE id = ?");
            $programStmt->execute([$programId]);
            $programUserId = $programStmt->fetchColumn();
            
            // Notify user about approval
            createProgramNotification(
                $programUserId,
                'Program Approved',
                'Your program has been approved by finance.',
                'success'
            );
            
            echo json_encode([
                'success' => true, 
                'message' => 'Program approved successfully'
            ]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Failed to approve program']);
        }
        
    } catch (Exception $e) {
        error_log("Error approving program: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to approve program: ' . $e->getMessage()]);
    }
}

function rejectProgram() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Map frontend field names to backend expectations
        $programId = $data['programId'] ?? $data['program_id'];
        $rejectionReason = $data['rejectionReason'] ?? $data['rejection_reason'];
        $rejectedBy = $data['rejected_by'] ?? 1; // Default to finance user ID 1
        
        if (!$programId || !$rejectionReason) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: programId and rejectionReason']);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE programs 
            SET status = 'rejected', rejected_by = ?, rejected_at = CURRENT_TIMESTAMP,
                rejection_reason = ?
            WHERE id = ?
        ");
        
        $result = $stmt->execute([
            $rejectedBy,
            $rejectionReason,
            $programId
        ]);
        
        if ($result && $stmt->rowCount() > 0) {
            // Get program details
            $programStmt = $pdo->prepare("SELECT user_id FROM programs WHERE id = ?");
            $programStmt->execute([$programId]);
            $programUserId = $programStmt->fetchColumn();
            
            // Notify user about rejection
            createProgramNotification(
                $programUserId,
                'Program Rejected',
                'Your program has been rejected by finance.',
                'error'
            );
            
            echo json_encode([
                'success' => true, 
                'message' => 'Program rejected successfully'
            ]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Failed to reject program']);
        }
        
    } catch (Exception $e) {
        error_log("Error rejecting program: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to reject program: ' . $e->getMessage()]);
    }
}

function acceptDocument() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Map frontend field names to backend expectations
        $programId = $data['programId'] ?? $data['program_id'];
        $acceptedBy = $data['accepted_by'] ?? 1; // Default to finance user ID 1
        
        if (!$programId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required field: programId']);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE programs 
            SET status = 'mmk_accepted', mmk_accepted_by = ?, mmk_accepted_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'approved'
        ");
        
        $result = $stmt->execute([
            $acceptedBy,
            $programId
        ]);
        
        if ($result && $stmt->rowCount() > 0) {
            // Get program details
            $programStmt = $pdo->prepare("SELECT user_id FROM programs WHERE id = ?");
            $programStmt->execute([$programId]);
            $programUserId = $programStmt->fetchColumn();
            
            // Notify user about document acceptance
            createProgramNotification(
                $programUserId,
                'Document Accepted',
                'Your program document has been accepted by finance (skipping MMK review).',
                'success'
            );
            
            echo json_encode([
                'success' => true, 
                'message' => 'Document accepted successfully'
            ]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Failed to accept document or program not in approved status']);
        }
        
    } catch (Exception $e) {
        error_log("Error accepting document: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to accept document: ' . $e->getMessage()]);
    }
}

function deductBudget() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Map frontend field names to backend expectations
        $programId = $data['programId'] ?? $data['program_id'];
        $amount = $data['amount'] ?? $data['deduction_amount'];
        $reason = $data['reason'] ?? $data['deduction_reason'];
        $deductedBy = $data['deducted_by'] ?? 1; // Default to finance user ID 1
        
        if (!$programId || !$amount || !$reason) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: programId, amount, and reason']);
            return;
        }
        
        // Start transaction
        $pdo->beginTransaction();
        
        // Insert budget deduction record
        $stmt = $pdo->prepare("
            INSERT INTO budget_deductions (program_id, deducted_by, deduction_amount, deduction_reason)
            VALUES (?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $programId,
            $deductedBy,
            $amount,
            $reason
        ]);
        
        // Update program budget and status
        $updateStmt = $pdo->prepare("
            UPDATE programs 
            SET budget_deducted = budget_deducted + ?, status = 'budget_deducted'
            WHERE id = ?
        ");
        
        $updateStmt->execute([$amount, $programId]);
        
        // Add to budget tracking
        $trackingStmt = $pdo->prepare("
            INSERT INTO budget_tracking (program_id, amount, transaction_type, description, transaction_date, created_by)
            VALUES (?, ?, 'deduction', ?, CURRENT_DATE, ?)
        ");
        
        $trackingStmt->execute([
            $programId,
            $amount,
            $reason,
            $deductedBy
        ]);
        
        $pdo->commit();
        
        // Get program details
        $programStmt = $pdo->prepare("SELECT user_id FROM programs WHERE id = ?");
        $programStmt->execute([$programId]);
        $programUserId = $programStmt->fetchColumn();
        
        // Notify user about budget deduction
        createProgramNotification(
            $programUserId,
            'Budget Deducted',
            'Budget has been deducted from your program.',
            'warning'
        );
        
        echo json_encode([
            'success' => true, 
            'message' => 'Budget deducted successfully'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Error deducting budget: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to deduct budget: ' . $e->getMessage()]);
    }
}

function addRemark() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Debug logging
        error_log("addRemark called with data: " . json_encode($data));
        
        // Map frontend field names to backend expectations
        $programId = $data['programId'] ?? $data['program_id'];
        $remarkText = $data['remark'] ?? $data['remark_text'];
        $remarkedBy = $data['remarked_by'] ?? null;
        
        // Debug logging
        error_log("Raw data received: " . json_encode($data));
        error_log("Raw remarked_by: " . var_export($remarkedBy, true));
        
        // Convert string IDs to integers for database
        $programId = (int)$programId;
        $remarkedBy = $remarkedBy ? (int)$remarkedBy : null;
        
        error_log("Mapped values - programId: $programId, remarkText: $remarkText, remarkedBy: $remarkedBy");
        
        if (!$remarkedBy || $remarkedBy <= 0) {
            error_log("Error: remarked_by is missing, invalid, or zero - value: " . var_export($remarkedBy, true));
            http_response_code(400);
            echo json_encode(['error' => 'User ID required for adding remark']);
            return;
        }
        
        if (!$programId || !$remarkText) {
            error_log("Error: Missing required fields - programId: $programId, remarkText: $remarkText");
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: programId and remark']);
            return;
        }
        
        // Check if program exists
        $checkStmt = $pdo->prepare("SELECT id FROM programs WHERE id = ?");
        $checkStmt->execute([$programId]);
        if (!$checkStmt->fetch()) {
            error_log("Error: Program not found with ID: $programId");
            http_response_code(404);
            echo json_encode(['error' => 'Program not found']);
            return;
        }
        
        // Check if user exists
        $userStmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $userStmt->execute([$remarkedBy]);
        if (!$userStmt->fetch()) {
            error_log("Error: User not found with ID: $remarkedBy");
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO program_remarks (program_id, remarked_by, remark_text)
            VALUES (?, ?, ?)
        ");
        
        $result = $stmt->execute([$programId, $remarkedBy, $remarkText]);
        
        if ($result) {
            error_log("Remark added successfully");
            echo json_encode([
                'success' => true, 
                'message' => 'Remark added successfully'
            ]);
        } else {
            error_log("Database error: " . json_encode($stmt->errorInfo()));
            http_response_code(500);
            echo json_encode(['error' => 'Database error occurred']);
        }
        
    } catch (Exception $e) {
        error_log("Error adding remark: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add remark: ' . $e->getMessage()]);
    }
}

function updateProgram() {
    global $pdo;
    
    try {
        // Support both JSON payloads and form-data (to avoid host blocking)
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        // Merge with $_POST if present (supports FormData)
        if (isset($_POST) && is_array($_POST)) {
            $data = array_merge(is_array($data) ? $data : [], $_POST);
        }
        // Accept id from query string or request body
        $id = $_GET['id'] ?? ($data['id'] ?? null);
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Program ID required']);
            return;
        }
        
        // Check if program exists
        $stmt = $pdo->prepare("SELECT * FROM programs WHERE id = ?");
        $stmt->execute([$id]);
        $existingProgram = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existingProgram) {
            http_response_code(404);
            echo json_encode(['error' => 'Program not found']);
            return;
        }
        
        // Check if user is trying to change status and if they have permission
        if (isset($data['status'])) {
            $requestingUserId = $data['user_id'] ?? null;
            
            if ($requestingUserId) {
                $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
                $stmt->execute([$requestingUserId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$user || $user['role'] !== 'admin') {
                    http_response_code(403);
                    echo json_encode(['error' => 'Only administrators can change program status']);
                    return;
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required for status changes']);
                return;
            }
    }
    
    $updateFields = [];
    $params = [];
    
    $allowedFields = [
        'title', 'description', 'department', 'recipient_name', 'budget',
        'start_date', 'end_date', 'letter_reference_number', 'status', 'submitted_by'
    ];
    
    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $data)) {
            $updateFields[] = "$field = ?";
            $params[] = $data[$field];
        }
    }
    
    if (isset($data['objectives'])) {
        $updateFields[] = "objectives = ?";
        // Accept JSON string or array
        $objectivesVal = $data['objectives'];
        if (is_string($objectivesVal)) {
            // Try decode; if fails, store raw string
            $decoded = json_decode($objectivesVal, true);
            $objectivesVal = $decoded !== null ? $decoded : $objectivesVal;
        }
        $params[] = is_array($objectivesVal) ? json_encode($objectivesVal) : $objectivesVal;
    }
    
    if (isset($data['kpi'])) {
        $updateFields[] = "kpi_data = ?";
        $kpiVal = $data['kpi'];
        if (is_string($kpiVal)) {
            $decoded = json_decode($kpiVal, true);
            $kpiVal = $decoded !== null ? $decoded : $kpiVal;
        }
        $params[] = is_array($kpiVal) ? json_encode($kpiVal) : $kpiVal;
    }
    
    if (isset($data['documents'])) {
        $updateFields[] = "documents = ?";
            $documentsVal = $data['documents'];
            if (is_string($documentsVal)) {
                $decoded = json_decode($documentsVal, true);
                $documentsVal = $decoded !== null ? $decoded : $documentsVal;
            }
            $params[] = is_array($documentsVal) ? json_encode($documentsVal) : $documentsVal;

            // Append document history entries for any new file versions
            try {
                $pdo->exec("CREATE TABLE IF NOT EXISTS document_history (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    program_id INT NOT NULL,
                    category VARCHAR(255) NOT NULL,
                    original_name VARCHAR(255) NOT NULL,
                    stored_name VARCHAR(255) NOT NULL,
                    uploaded_by INT NULL,
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX(program_id), INDEX(category)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
                $docs = is_array($documentsVal) ? $documentsVal : json_decode((string)$documentsVal, true);
                if (is_array($docs)) {
                    foreach ($docs as $doc) {
                        if (is_array($doc) && isset($doc['storedName'])) {
                            // Only insert if this storedName not already recorded for this program
                            $dup = $pdo->prepare("SELECT 1 FROM document_history WHERE program_id = ? AND stored_name = ? LIMIT 1");
                            $dup->execute([$id, $doc['storedName']]);
                            if (!$dup->fetch()) {
                                $ins = $pdo->prepare("INSERT INTO document_history (program_id, category, original_name, stored_name, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, NOW())");
                                $ins->execute([$id, $doc['category'] ?? 'Uncategorized', $doc['originalName'] ?? '', $doc['storedName'], $data['user_id'] ?? null]);
                            }
                        }
                    }
                }
            } catch (Exception $e) {
                // swallow
            }
    }
    
    if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            return;
    }
    
    $params[] = $id;
    $sql = "UPDATE programs SET " . implode(', ', $updateFields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Get updated program
    $stmt = $pdo->prepare("
            SELECT p.*, u.name as user_name, u.role as user_role
        FROM programs p 
        LEFT JOIN users u ON p.user_id = u.id 
        WHERE p.id = ?
    ");
    $stmt->execute([$id]);
        $program = $stmt->fetch(PDO::FETCH_ASSOC);
        
        parseProgramJsonFields($program);
        
        // Get the role of the user making the request
        $requestingUserRole = 'user';
        if (isset($data['user_id'])) {
            $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
            $stmt->execute([$data['user_id']]);
            $requestingUser = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($requestingUser) {
                $requestingUserRole = $requestingUser['role'];
            }
        }
        
        // Create notification for program update
        if (isset($program['user_id'])) {
            notifyProgramUpdated($program['id'], $program['user_id'], $requestingUserRole, $data['user_id'] ?? null);
            
            // If program was previously submitted and is being edited, notify finance
            if ($existingProgram['status'] !== 'draft' && $requestingUserRole === 'user') {
                // Notify all finance users about the edit
                $financeStmt = $pdo->prepare("SELECT id FROM users WHERE role IN ('Finance MMK', 'finance_officer')");
                $financeStmt->execute();
                $financeUsers = $financeStmt->fetchAll();
                
                foreach ($financeUsers as $financeUser) {
                    createProgramNotification(
                        $financeUser['id'],
                        'Program Updated by User',
                        "Program '{$program['title']}' has been updated by the user after submission. Please review the changes.",
                        'warning'
                    );
                }
            }
        }
        
        // If status was changed by admin, create a specific status change notification
        if (isset($data['status']) && isset($program['user_id'])) {
            $oldStatus = $existingProgram['status'];
            $newStatus = $data['status'];
            
            if ($oldStatus !== $newStatus) {
                notifyProgramStatusChanged($program['id'], $newStatus, $program['user_id'], $requestingUserRole, $data['user_id'] ?? null);
            }
        }
        
        echo json_encode([
            'success' => true,
            'program' => $program,
            'message' => 'Program updated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log("Error updating program: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update program']);
    }
}

function deleteProgram() {
    global $pdo;
    
    try {
        $id = $_GET['id'] ?? null;
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Program ID required']);
            return;
        }
        
        // Check if program exists and get its details before deletion
        $stmt = $pdo->prepare("SELECT id, title, user_id FROM programs WHERE id = ?");
    $stmt->execute([$id]);
        $program = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$program) {
            http_response_code(404);
            echo json_encode(['error' => 'Program not found']);
            return;
        }
        
        // Get the role of the user making the request
        $requestingUserRole = 'user';
        if (isset($data['user_id'])) {
            $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
            $stmt->execute([$data['user_id']]);
            $requestingUser = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($requestingUser) {
                $requestingUserRole = $requestingUser['role'];
            }
    }
    
    $stmt = $pdo->prepare("DELETE FROM programs WHERE id = ?");
    $stmt->execute([$id]);
    
        // Create notification for program deletion - only notify the program owner
        if (isset($program['user_id'])) {
            $title = "Program Deleted";
            $message = "Your program '{$program['title']}' has been successfully deleted.";
            $userResult = createProgramNotification($program['user_id'], $title, $message, 'info');
            
            // Get the username for the deletion notification
            $username = '';
            if (isset($data['user_id'])) {
                $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
                $stmt->execute([$data['user_id']]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($user) {
                    $username = " (" . $user['name'] . ")";
                }
            }
            
            // Also notify admin about program deletion
            $adminResult = createSystemNotification(
                "Program Deleted by " . ucfirst($requestingUserRole), 
                "A program '{$program['title']}' has been deleted by a " . $requestingUserRole . $username . "."
            );
        }
        
        echo json_encode(['success' => true, 'message' => 'Program deleted successfully']);
        
    } catch (Exception $e) {
        error_log("Error deleting program: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete program']);
    }
}

function updateProgramField() {
    global $pdo;
    try {
        // Support both JSON and form-encoded bodies
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (!is_array($data) || empty($data)) {
            $data = $_POST ?? [];
        }

        $id = $data['id'] ?? null;
        $field = $data['field'] ?? null;
        $value = $data['value'] ?? null;

        if (!$id || !$field) {
            http_response_code(400);
            echo json_encode(['error' => 'Program ID and field are required']);
            return;
        }

        // Allowlist of updatable simple fields
        $allowed = [
            'letter_reference_number',
            'title',
            'description',
            'department',
            'recipient_name',
            'budget',
            'start_date',
            'end_date',
            'submitted_by'
        ];

        if (!in_array($field, $allowed, true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Field not allowed']);
            return;
        }

        $sql = "UPDATE programs SET {$field} = ? WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$value, $id]);

        // Fetch minimal updated data
        $stmt = $pdo->prepare("SELECT id, {$field} FROM programs WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'program' => $row,
            'message' => 'Field updated successfully'
        ]);
    } catch (Exception $e) {
        error_log('Error in updateProgramField: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update field']);
    }
}

function getUserQueries() {
    global $pdo;
    
    try {
        $userId = $_GET['user_id'] ?? null;
        
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID required']);
            return;
        }
        
        // Get queries for programs owned by this user
        $stmt = $pdo->prepare("
            SELECT pq.*, p.title as program_title, p.status as program_status,
                   u1.name as queried_by_name, u2.name as answered_by_name
            FROM program_queries pq
            JOIN programs p ON pq.program_id = p.id
            JOIN users u1 ON pq.queried_by = u1.id
            LEFT JOIN users u2 ON pq.answered_by = u2.id
            WHERE p.user_id = ?
            ORDER BY pq.query_date DESC
        ");
        
        $stmt->execute([$userId]);
        $queries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'queries' => $queries
        ]);
        
    } catch (Exception $e) {
        error_log("Error fetching user queries: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch queries']);
    }
}

function getFinanceQueries() {
    global $pdo;
    
    try {
        // Get all queries with program and user details
        $stmt = $pdo->prepare("
            SELECT pq.*, p.title as program_title, p.status as program_status,
                   u1.name as queried_by_name, u2.name as answered_by_name,
                   p.user_id as program_owner_id, u3.name as program_owner_name
            FROM program_queries pq
            JOIN programs p ON pq.program_id = p.id
            JOIN users u1 ON pq.queried_by = u1.id
            LEFT JOIN users u2 ON pq.answered_by = u2.id
            JOIN users u3 ON p.user_id = u3.id
            ORDER BY pq.query_date DESC
        ");
        
        $stmt->execute();
        $queries = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'queries' => $queries
        ]);
        
    } catch (Exception $e) {
        error_log("Error fetching finance queries: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch queries']);
    }
}

function generateProgramReport() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $programId = $data['programId'] ?? null;
        
        if (!$programId) {
            http_response_code(400);
            echo json_encode(['error' => 'Program ID required for report generation']);
            return;
        }
        
        // Get program details
        $programStmt = $pdo->prepare("
            SELECT p.*, u.name as user_name, u.role as user_role,
                   a.name as approver_name, r.name as rejector_name
            FROM programs p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN users a ON p.approved_by = a.id
            LEFT JOIN users r ON p.rejected_by = r.id
            WHERE p.id = ?
        ");
        $programStmt->execute([$programId]);
        $program = $programStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$program) {
            http_response_code(404);
            echo json_encode(['error' => 'Program not found']);
            return;
        }
        
        parseProgramJsonFields($program);
        
        // Get queries for this program
        $queryStmt = $pdo->prepare("
            SELECT pq.*, u1.name as queried_by_name, u2.name as answered_by_name
            FROM program_queries pq
            LEFT JOIN users u1 ON pq.queried_by = u1.id
            LEFT JOIN users u2 ON pq.answered_by = u2.id
            WHERE pq.program_id = ?
            ORDER BY pq.query_date DESC
        ");
        $queryStmt->execute([$programId]);
        $program['queries'] = $queryStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get remarks for this program
        $remarkStmt = $pdo->prepare("
            SELECT pr.*, u.name as remarked_by_name
            FROM program_remarks pr
            LEFT JOIN users u ON pr.remarked_by = u.id
            WHERE pr.program_id = ?
            ORDER BY pr.remark_date DESC
        ");
        $remarkStmt->execute([$programId]);
        $program['remarks'] = $remarkStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get budget deductions for this program
        $deductionStmt = $pdo->prepare("
            SELECT bd.*, u.name as deducted_by_name
            FROM budget_deductions bd
            LEFT JOIN users u ON bd.deducted_by = u.id
            WHERE bd.program_id = ?
            ORDER BY bd.deduction_date DESC
        ");
        $deductionStmt->execute([$programId]);
        $program['budget_deductions'] = $deductionStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get user details
        $userStmt = $pdo->prepare("SELECT name, role FROM users WHERE id = ?");
        $userStmt->execute([$program['user_id']]);
        $program['user_name'] = $userStmt->fetchColumn(0);
        $program['user_role'] = $userStmt->fetchColumn(1);
        
        // Get approver and rejector details
        if ($program['approved_by']) {
            $approverStmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
            $approverStmt->execute([$program['approved_by']]);
            $program['approver_name'] = $approverStmt->fetchColumn();
        }
        if ($program['rejected_by']) {
            $rejectorStmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
            $rejectorStmt->execute([$program['rejected_by']]);
            $program['rejector_name'] = $rejectorStmt->fetchColumn();
        }
        
        // Get submitted by details
        $submittedByStmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
        $submittedByStmt->execute([$program['submitted_by']]);
        $program['submitted_by_name'] = $submittedByStmt->fetchColumn();
        
        // Get current status
        $program['current_status'] = $program['status'];
        
        // Get dates
        $program['start_date'] = date('Y-m-d', strtotime($program['start_date']));
        $program['end_date'] = date('Y-m-d', strtotime($program['end_date']));
        $program['submitted_at'] = date('Y-m-d H:i:s', strtotime($program['submitted_at']));
        $program['approved_at'] = date('Y-m-d H:i:s', strtotime($program['approved_at']));
        $program['rejected_at'] = date('Y-m-d H:i:s', strtotime($program['rejected_at']));
        $program['budget_deducted_at'] = date('Y-m-d H:i:s', strtotime($program['budget_deducted_at']));
        
        // Get JSON fields
        $program['objectives'] = json_decode($program['objectives'], true);
        $program['kpi_data'] = json_decode($program['kpi_data'], true);
        $program['documents'] = json_decode($program['documents'], true);
        
        // Get total budget and budget deducted
        $program['total_budget'] = $program['budget'];
        $program['total_budget_deducted'] = $program['budget_deducted'];
        
        // Get total queries and answered queries
        $program['total_queries'] = count($program['queries']);
        $program['answered_queries'] = 0;
        foreach ($program['queries'] as $query) {
            if ($query['status'] === 'answered') {
                $program['answered_queries']++;
            }
        }
        
        // Get total remarks
        $program['total_remarks'] = count($program['remarks']);
        
        // Get total budget deductions
        $program['total_budget_deductions'] = count($program['budget_deductions']);
        
        // Get total budget tracking
        $trackingStmt = $pdo->prepare("
            SELECT SUM(amount) as total_amount, transaction_type, transaction_date
            FROM budget_tracking
            WHERE program_id = ?
            GROUP BY transaction_type, transaction_date
        ");
        $trackingStmt->execute([$programId]);
        $program['budget_tracking'] = $trackingStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total budget tracking by type
        $trackingByTypeStmt = $pdo->prepare("
            SELECT SUM(amount) as total_amount, transaction_type
            FROM budget_tracking
            WHERE program_id = ?
            GROUP BY transaction_type
        ");
        $trackingByTypeStmt->execute([$programId]);
        $program['budget_tracking_by_type'] = $trackingByTypeStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total budget tracking by date
        $trackingByDateStmt = $pdo->prepare("
            SELECT SUM(amount) as total_amount, transaction_date
            FROM budget_tracking
            WHERE program_id = ?
            GROUP BY transaction_date
        ");
        $trackingByDateStmt->execute([$programId]);
        $program['budget_tracking_by_date'] = $trackingByDateStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'report' => $program
        ]);
        
    } catch (Exception $e) {
        error_log("Error generating program report: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate program report']);
    }
}

function generateBulkReport() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $status = $data['status'] ?? null;
        $startDate = $data['start_date'] ?? null;
        $endDate = $data['end_date'] ?? null;
        
        // If no filters are provided, get all programs (for 'both' report type)
        if (!$status && !$startDate && !$endDate) {
            $sql = "
                SELECT p.*, u.name as user_name, u.role as user_role,
                       a.name as approver_name, r.name as rejector_name
                FROM programs p 
                LEFT JOIN users u ON p.user_id = u.id 
                    LEFT JOIN users a ON p.approved_by = a.id
                    LEFT JOIN users r ON p.rejected_by = r.id
                ORDER BY p.created_at DESC
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $whereConditions = [];
            $params = [];
            
            if ($status) {
                $whereConditions[] = "p.status = ?";
                $params[] = $status;
            }
            if ($startDate) {
                $whereConditions[] = "p.created_at >= ?";
                $params[] = $startDate . ' 00:00:00';
            }
            if ($endDate) {
                $whereConditions[] = "p.created_at <= ?";
                $params[] = $endDate . ' 23:59:59';
            }
            
            $whereClause = '';
            if (!empty($whereConditions)) {
                $whereClause = " WHERE " . implode(" AND ", $whereConditions);
            }
            
            $sql = "
                SELECT p.*, u.name as user_name, u.role as user_role,
                       a.name as approver_name, r.name as rejector_name
                FROM programs p 
                LEFT JOIN users u ON p.user_id = u.id 
                    LEFT JOIN users a ON p.approved_by = a.id
                    LEFT JOIN users r ON p.rejected_by = r.id
                {$whereClause}
                ORDER BY p.created_at DESC
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Parse JSON fields and fetch additional data for each program
        foreach ($programs as &$program) {
            parseProgramJsonFields($program);
            
            // Get queries for this program
            $queryStmt = $pdo->prepare("
                SELECT pq.*, u1.name as queried_by_name, u2.name as answered_by_name
                FROM program_queries pq
                LEFT JOIN users u1 ON pq.queried_by = u1.id
                LEFT JOIN users u2 ON pq.answered_by = u2.id
                WHERE pq.program_id = ?
                ORDER BY pq.query_date DESC
            ");
            $queryStmt->execute([$program['id']]);
            $program['queries'] = $queryStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get remarks for this program
            $remarkStmt = $pdo->prepare("
                SELECT pr.*, u.name as remarked_by_name
                FROM program_remarks pr
                LEFT JOIN users u ON pr.remarked_by = u.id
                WHERE pr.program_id = ?
                ORDER BY pr.remark_date DESC
            ");
            $remarkStmt->execute([$program['id']]);
            $program['remarks'] = $remarkStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get budget deductions for this program
            $deductionStmt = $pdo->prepare("
                SELECT bd.*, u.name as deducted_by_name
                FROM budget_deductions bd
                LEFT JOIN users u ON bd.deducted_by = u.id
                WHERE bd.program_id = ?
                ORDER BY bd.deduction_date DESC
            ");
            $deductionStmt->execute([$program['id']]);
            $program['budget_deductions'] = $deductionStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode([
            'success' => true,
            'programs' => $programs
        ]);
        
    } catch (Exception $e) {
        error_log("Error generating bulk report: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate bulk report']);
    }
}

function getUserProgramsByEmail() {
    global $pdo;
    
    try {
        $email = $_GET['email'] ?? '';
        $viewerId = isset($_GET['viewer_id']) ? intval($_GET['viewer_id']) : null;
        
        if (empty($email)) {
            http_response_code(400);
            echo json_encode(['error' => 'Email parameter is required']);
            return;
        }
        
        // First, find the user by email
        $userStmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $userStmt->execute([$email]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            echo json_encode([
                'success' => true,
                'programs' => []
            ]);
            return;
        }
        
        // Determine if the viewer can see drafts
        $canSeeDrafts = false;
        if ($viewerId) {
            $viewerStmt = $pdo->prepare("SELECT id, role FROM users WHERE id = ?");
            $viewerStmt->execute([$viewerId]);
            $viewer = $viewerStmt->fetch(PDO::FETCH_ASSOC);
            if ($viewer) {
                // Owner or admin-level roles can see drafts
                if (intval($viewer['id']) === intval($user['id']) || in_array($viewer['role'], ['admin', 'super_admin'])) {
                    $canSeeDrafts = true;
                }
            }
        }

        // Get programs for this user. Finance viewers should not see drafts
        $sql = "
            SELECT p.*, u.name as user_name, u.role as user_role,
                   a.name as approver_name, r.name as rejector_name
            FROM programs p 
            LEFT JOIN users u ON p.user_id = u.id 
            LEFT JOIN users a ON p.approved_by = a.id
            LEFT JOIN users r ON p.rejected_by = r.id
            WHERE p.user_id = ?" . ($canSeeDrafts ? "" : " AND p.status <> 'draft'") . "
            ORDER BY p.created_at DESC
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user['id']]);
        $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse JSON fields for each program
        foreach ($programs as &$program) {
            parseProgramJsonFields($program);
        }
        
        echo json_encode([
            'success' => true,
            'programs' => $programs
        ]);
        
    } catch (Exception $e) {
        error_log("Error fetching user programs by email: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch user programs']);
    }
}
?>