<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['program_id'])) {
            getProgramBudget($_GET['program_id']);
        } else {
            getAllBudgets();
        }
        break;
    case 'POST':
        addBudgetTransaction($input);
        break;
    case 'PUT':
        if (isset($_GET['id'])) {
            updateBudgetTransaction($_GET['id'], $input);
        } else {
            sendError('Transaction ID required', 400);
        }
        break;
    case 'DELETE':
        if (isset($_GET['id'])) {
            deleteBudgetTransaction($_GET['id']);
        } else {
            sendError('Transaction ID required', 400);
        }
        break;
    default:
        sendError('Method not allowed', 405);
}

function getAllBudgets() {
    $pdo = getConnection();
    
    $stmt = $pdo->query("
        SELECT bt.*, p.title as program_title, u.name as created_by_name
        FROM budget_tracking bt
        LEFT JOIN programs p ON bt.program_id = p.id
        LEFT JOIN users u ON bt.created_by = u.id
        ORDER BY bt.created_at DESC
    ");
    $transactions = $stmt->fetchAll();
    
    sendResponse($transactions);
}

function getProgramBudget($programId) {
    $pdo = getConnection();
    
    // Get program details
    $stmt = $pdo->prepare("SELECT * FROM programs WHERE id = ?");
    $stmt->execute([$programId]);
    $program = $stmt->fetch();
    
    if (!$program) {
        sendError('Program not found', 404);
    }
    
    // Get budget transactions
    $stmt = $pdo->prepare("
        SELECT bt.*, u.name as created_by_name
        FROM budget_tracking bt
        LEFT JOIN users u ON bt.created_by = u.id
        WHERE bt.program_id = ?
        ORDER BY bt.transaction_date DESC
    ");
    $stmt->execute([$programId]);
    $transactions = $stmt->fetchAll();
    
    // Calculate totals
    $totalIncome = 0;
    $totalExpense = 0;
    foreach ($transactions as $transaction) {
        if ($transaction['transaction_type'] === 'income') {
            $totalIncome += $transaction['amount'];
        } else {
            $totalExpense += $transaction['amount'];
        }
    }
    
    $budget = [
        'program' => $program,
        'transactions' => $transactions,
        'summary' => [
            'allocated_budget' => $program['budget'],
            'total_income' => $totalIncome,
            'total_expense' => $totalExpense,
            'remaining_budget' => $program['budget'] + $totalIncome - $totalExpense,
            'utilization_percentage' => $program['budget'] > 0 ? (($totalExpense / $program['budget']) * 100) : 0
        ]
    ];
    
    sendResponse($budget);
}

function addBudgetTransaction($data) {
    validateRequired($data, ['program_id', 'amount', 'transaction_type', 'description', 'transaction_date']);
    
    $pdo = getConnection();
    
    // Check if program exists
    $stmt = $pdo->prepare("SELECT id FROM programs WHERE id = ?");
    $stmt->execute([$data['program_id']]);
    if (!$stmt->fetch()) {
        sendError('Program not found', 404);
    }
    
    // Validate amount
    if (!is_numeric($data['amount']) || $data['amount'] <= 0) {
        sendError('Amount must be a positive number', 400);
    }
    
    // Validate transaction type
    if (!in_array($data['transaction_type'], ['income', 'expense'])) {
        sendError('Transaction type must be either "income" or "expense"', 400);
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO budget_tracking (program_id, amount, transaction_type, description, transaction_date, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['program_id'],
        $data['amount'],
        $data['transaction_type'],
        $data['description'],
        $data['transaction_date'],
        $data['created_by'] ?? 1 // Default to admin if not specified
    ]);
    
    $transactionId = $pdo->lastInsertId();
    
    // Get the created transaction
    $stmt = $pdo->prepare("
        SELECT bt.*, u.name as created_by_name
        FROM budget_tracking bt
        LEFT JOIN users u ON bt.created_by = u.id
        WHERE bt.id = ?
    ");
    $stmt->execute([$transactionId]);
    $transaction = $stmt->fetch();
    
    sendResponse($transaction, 201);
}

function updateBudgetTransaction($id, $data) {
    $pdo = getConnection();
    
    // Check if transaction exists
    $stmt = $pdo->prepare("SELECT id FROM budget_tracking WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        sendError('Transaction not found', 404);
    }
    
    $updateFields = [];
    $params = [];
    
    if (isset($data['amount'])) {
        if (!is_numeric($data['amount']) || $data['amount'] <= 0) {
            sendError('Amount must be a positive number', 400);
        }
        $updateFields[] = "amount = ?";
        $params[] = $data['amount'];
    }
    
    if (isset($data['transaction_type'])) {
        if (!in_array($data['transaction_type'], ['income', 'expense'])) {
            sendError('Transaction type must be either "income" or "expense"', 400);
        }
        $updateFields[] = "transaction_type = ?";
        $params[] = $data['transaction_type'];
    }
    
    if (isset($data['description'])) {
        $updateFields[] = "description = ?";
        $params[] = $data['description'];
    }
    
    if (isset($data['transaction_date'])) {
        $updateFields[] = "transaction_date = ?";
        $params[] = $data['transaction_date'];
    }
    
    if (empty($updateFields)) {
        sendError('No fields to update', 400);
    }
    
    $params[] = $id;
    $sql = "UPDATE budget_tracking SET " . implode(', ', $updateFields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Get updated transaction
    $stmt = $pdo->prepare("
        SELECT bt.*, u.name as created_by_name
        FROM budget_tracking bt
        LEFT JOIN users u ON bt.created_by = u.id
        WHERE bt.id = ?
    ");
    $stmt->execute([$id]);
    $transaction = $stmt->fetch();
    
    sendResponse($transaction);
}

function deleteBudgetTransaction($id) {
    $pdo = getConnection();
    
    // Check if transaction exists
    $stmt = $pdo->prepare("SELECT id FROM budget_tracking WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        sendError('Transaction not found', 404);
    }
    
    $stmt = $pdo->prepare("DELETE FROM budget_tracking WHERE id = ?");
    $stmt->execute([$id]);
    
    sendResponse(['success' => true, 'message' => 'Transaction deleted successfully']);
}
?> 