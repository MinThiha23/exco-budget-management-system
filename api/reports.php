<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['type'])) {
            switch ($_GET['type']) {
                case 'financial':
                    getFinancialReport($_GET);
                    break;
                case 'programs':
                    getProgramReport($_GET);
                    break;
                case 'budget':
                    getBudgetReport($_GET);
                    break;
                case 'activity':
                    getActivityReport($_GET);
                    break;
                default:
                    sendError('Invalid report type', 400);
            }
        } else {
            sendError('Report type required', 400);
        }
        break;
    default:
        sendError('Method not allowed', 405);
}

function getFinancialReport($params) {
    $pdo = getConnection();
    
    $startDate = $params['start_date'] ?? date('Y-m-01');
    $endDate = $params['end_date'] ?? date('Y-m-t');
    
    // Get total budget allocation
    $stmt = $pdo->prepare("
        SELECT 
            SUM(budget) as total_allocated,
            COUNT(*) as total_programs
        FROM programs 
        WHERE created_at BETWEEN ? AND ?
    ");
    $stmt->execute([$startDate, $endDate]);
    $budgetSummary = $stmt->fetch();
    
    // Get budget transactions
    $stmt = $pdo->prepare("
        SELECT 
            SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expense
        FROM budget_tracking 
        WHERE transaction_date BETWEEN ? AND ?
    ");
    $stmt->execute([$startDate, $endDate]);
    $transactionSummary = $stmt->fetch();
    
    // Get programs by status
    $stmt = $pdo->prepare("
        SELECT 
            status,
            COUNT(*) as count,
            SUM(budget) as total_budget
        FROM programs 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY status
    ");
    $stmt->execute([$startDate, $endDate]);
    $programsByStatus = $stmt->fetchAll();
    
    // Get top programs by budget
    $stmt = $pdo->prepare("
        SELECT 
            p.title,
            p.budget,
            p.status,
            u.name as submitted_by
        FROM programs p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.created_at BETWEEN ? AND ?
        ORDER BY p.budget DESC
        LIMIT 10
    ");
    $stmt->execute([$startDate, $endDate]);
    $topPrograms = $stmt->fetchAll();
    
    $report = [
        'period' => [
            'start_date' => $startDate,
            'end_date' => $endDate
        ],
        'summary' => [
            'total_allocated' => $budgetSummary['total_allocated'] ?? 0,
            'total_income' => $transactionSummary['total_income'] ?? 0,
            'total_expense' => $transactionSummary['total_expense'] ?? 0,
            'net_budget' => ($budgetSummary['total_allocated'] ?? 0) + ($transactionSummary['total_income'] ?? 0) - ($transactionSummary['total_expense'] ?? 0),
            'total_programs' => $budgetSummary['total_programs'] ?? 0
        ],
        'programs_by_status' => $programsByStatus,
        'top_programs' => $topPrograms
    ];
    
    sendResponse($report);
}

function getProgramReport($params) {
    $pdo = getConnection();
    
    $startDate = $params['start_date'] ?? date('Y-m-01');
    $endDate = $params['end_date'] ?? date('Y-m-t');
    $department = $params['department'] ?? null;
    
    $whereClause = "WHERE p.created_at BETWEEN ? AND ?";
    $queryParams = [$startDate, $endDate];
    
    if ($department) {
        $whereClause .= " AND p.department = ?";
        $queryParams[] = $department;
    }
    
    // Get programs with details
    $stmt = $pdo->prepare("
        SELECT 
            p.*,
            u.name as submitted_by,
            COUNT(pa.id) as approval_count,
            SUM(CASE WHEN pa.status = 'approved' THEN 1 ELSE 0 END) as approved_count
        FROM programs p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN program_approvals pa ON p.id = pa.program_id
        $whereClause
        GROUP BY p.id
        ORDER BY p.created_at DESC
    ");
    $stmt->execute($queryParams);
    $programs = $stmt->fetchAll();
    
    // Parse JSON fields
    foreach ($programs as &$program) {
        $program['objectives'] = json_decode($program['objectives'] ?? '[]', true);
        $program['kpi'] = json_decode($program['kpi_data'] ?? '[]', true);
        $program['documents'] = json_decode($program['documents'] ?? '[]', true);
        unset($program['kpi_data']);
    }
    
    // Get department summary
    $stmt = $pdo->prepare("
        SELECT 
            department,
            COUNT(*) as program_count,
            SUM(budget) as total_budget,
            AVG(budget) as avg_budget
        FROM programs 
        WHERE created_at BETWEEN ? AND ?
        GROUP BY department
        ORDER BY total_budget DESC
    ");
    $stmt->execute([$startDate, $endDate]);
    $departmentSummary = $stmt->fetchAll();
    
    $report = [
        'period' => [
            'start_date' => $startDate,
            'end_date' => $endDate
        ],
        'department_filter' => $department,
        'programs' => $programs,
        'department_summary' => $departmentSummary,
        'total_programs' => count($programs)
    ];
    
    sendResponse($report);
}

function getBudgetReport($params) {
    $pdo = getConnection();
    
    $startDate = $params['start_date'] ?? date('Y-m-01');
    $endDate = $params['end_date'] ?? date('Y-m-t');
    $programId = $params['program_id'] ?? null;
    
    if ($programId) {
        // Get specific program budget report
        $stmt = $pdo->prepare("
            SELECT 
                p.title,
                p.budget as allocated_budget,
                bt.transaction_type,
                bt.amount,
                bt.description,
                bt.transaction_date,
                u.name as created_by
            FROM programs p
            LEFT JOIN budget_tracking bt ON p.id = bt.program_id
            LEFT JOIN users u ON bt.created_by = u.id
            WHERE p.id = ? AND bt.transaction_date BETWEEN ? AND ?
            ORDER BY bt.transaction_date DESC
        ");
        $stmt->execute([$programId, $startDate, $endDate]);
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
        
        $report = [
            'program_id' => $programId,
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ],
            'summary' => [
                'allocated_budget' => $transactions[0]['allocated_budget'] ?? 0,
                'total_income' => $totalIncome,
                'total_expense' => $totalExpense,
                'remaining_budget' => ($transactions[0]['allocated_budget'] ?? 0) + $totalIncome - $totalExpense
            ],
            'transactions' => $transactions
        ];
    } else {
        // Get overall budget report
        $stmt = $pdo->prepare("
            SELECT 
                p.title as program_title,
                p.budget as allocated_budget,
                SUM(CASE WHEN bt.transaction_type = 'income' THEN bt.amount ELSE 0 END) as total_income,
                SUM(CASE WHEN bt.transaction_type = 'expense' THEN bt.amount ELSE 0 END) as total_expense
            FROM programs p
            LEFT JOIN budget_tracking bt ON p.id = bt.program_id AND bt.transaction_date BETWEEN ? AND ?
            GROUP BY p.id, p.title, p.budget
            ORDER BY p.budget DESC
        ");
        $stmt->execute([$startDate, $endDate]);
        $programBudgets = $stmt->fetchAll();
        
        $report = [
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ],
            'program_budgets' => $programBudgets
        ];
    }
    
    sendResponse($report);
}

function getActivityReport($params) {
    $pdo = getConnection();
    
    $startDate = $params['start_date'] ?? date('Y-m-01');
    $endDate = $params['end_date'] ?? date('Y-m-t');
    $userId = $params['user_id'] ?? null;
    
    $whereClause = "WHERE al.created_at BETWEEN ? AND ?";
    $queryParams = [$startDate, $endDate];
    
    if ($userId) {
        $whereClause .= " AND al.user_id = ?";
        $queryParams[] = $userId;
    }
    
    // Get activity logs
    $stmt = $pdo->prepare("
        SELECT 
            al.*,
            u.name as user_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        $whereClause
        ORDER BY al.created_at DESC
        LIMIT 100
    ");
    $stmt->execute($queryParams);
    $activities = $stmt->fetchAll();
    
    // Get activity summary by action
    $stmt = $pdo->prepare("
        SELECT 
            action,
            COUNT(*) as count
        FROM activity_logs al
        $whereClause
        GROUP BY action
        ORDER BY count DESC
    ");
    $stmt->execute($queryParams);
    $activitySummary = $stmt->fetchAll();
    
    // Get user activity summary
    $stmt = $pdo->prepare("
        SELECT 
            u.name as user_name,
            COUNT(al.id) as activity_count
        FROM users u
        LEFT JOIN activity_logs al ON u.id = al.user_id AND al.created_at BETWEEN ? AND ?
        GROUP BY u.id, u.name
        ORDER BY activity_count DESC
    ");
    $stmt->execute([$startDate, $endDate]);
    $userActivity = $stmt->fetchAll();
    
    $report = [
        'period' => [
            'start_date' => $startDate,
            'end_date' => $endDate
        ],
        'user_filter' => $userId,
        'activities' => $activities,
        'activity_summary' => $activitySummary,
        'user_activity' => $userActivity,
        'total_activities' => count($activities)
    ];
    
    sendResponse($report);
}
?> 