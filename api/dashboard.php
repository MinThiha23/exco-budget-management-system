<?php
require_once 'config.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getDashboardData();
        break;
    default:
        sendError('Method not allowed', 405);
}

function getDashboardData() {
    $pdo = getConnection();
    
    // Get current month and year
    $currentMonth = date('Y-m');
    $currentYear = date('Y');
    
    // Get total programs count
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM programs");
    $totalPrograms = $stmt->fetch()['total'];
    
    // Get programs by status
    $stmt = $pdo->query("
        SELECT 
            status,
            COUNT(*) as count
        FROM programs 
        GROUP BY status
    ");
    $programsByStatus = $stmt->fetchAll();
    
    // Get total budget allocated
    $stmt = $pdo->query("SELECT SUM(budget) as total_budget FROM programs");
    $totalBudget = $stmt->fetch()['total_budget'] ?? 0;
    
    // Get total users
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE is_active = 1");
    $totalUsers = $stmt->fetch()['total'];
    
    // Get recent programs (last 5)
    $stmt = $pdo->query("
        SELECT 
            p.*,
            u.name as user_name
        FROM programs p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 5
    ");
    $recentPrograms = $stmt->fetchAll();
    
    // Parse JSON fields for recent programs
    foreach ($recentPrograms as &$program) {
        $program['objectives'] = json_decode($program['objectives'] ?? '[]', true);
        $program['kpi'] = json_decode($program['kpi_data'] ?? '[]', true);
        $program['documents'] = json_decode($program['documents'] ?? '[]', true);
        unset($program['kpi_data']);
    }
    
    // Get monthly budget data for chart
    $stmt = $pdo->prepare("
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            SUM(budget) as total_budget,
            COUNT(*) as program_count
        FROM programs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
    ");
    $stmt->execute();
    $monthlyBudget = $stmt->fetchAll();
    
    // Get department statistics
    $stmt = $pdo->query("
        SELECT 
            department,
            COUNT(*) as program_count,
            SUM(budget) as total_budget,
            AVG(budget) as avg_budget
        FROM programs 
        WHERE department IS NOT NULL
        GROUP BY department
        ORDER BY total_budget DESC
        LIMIT 5
    ");
    $departmentStats = $stmt->fetchAll();
    
    // Get recent activity (last 10)
    try {
        $stmt = $pdo->query("
            SELECT 
                al.*,
                u.name as user_name
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 10
        ");
        $recentActivity = $stmt->fetchAll();
        
        // Parse JSON details for recent activity
        foreach ($recentActivity as &$activity) {
            $activity['details'] = json_decode($activity['details'] ?? '{}', true);
        }
    } catch (Exception $e) {
        $recentActivity = []; // Table might not exist
    }
    
    // Get pending approvals count
    try {
        $stmt = $pdo->query("
            SELECT COUNT(*) as count
            FROM program_approvals 
            WHERE status = 'pending'
        ");
        $pendingApprovals = $stmt->fetch()['count'];
    } catch (Exception $e) {
        $pendingApprovals = 0; // Table might not exist
    }
    
    // Get budget utilization
    try {
        $stmt = $pdo->query("
            SELECT 
                SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expense
            FROM budget_tracking
        ");
        $totalExpense = $stmt->fetch()['total_expense'] ?? 0;
    } catch (Exception $e) {
        $totalExpense = 0; // Table might not exist
    }
    
    $utilizationPercentage = $totalBudget > 0 ? (($totalExpense / $totalBudget) * 100) : 0;
    
    // Get top programs by budget
    $stmt = $pdo->query("
        SELECT 
            p.title,
            p.budget,
            p.status,
            u.name as submitted_by
        FROM programs p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.budget DESC
        LIMIT 5
    ");
    $topPrograms = $stmt->fetchAll();
    
    $dashboardData = [
        'summary' => [
            'total_programs' => $totalPrograms,
            'total_budget' => $totalBudget,
            'total_users' => $totalUsers,
            'pending_approvals' => $pendingApprovals,
            'budget_utilization' => round($utilizationPercentage, 2)
        ],
        'programs_by_status' => $programsByStatus,
        'recent_programs' => $recentPrograms,
        'monthly_budget' => $monthlyBudget,
        'department_stats' => $departmentStats,
        'recent_activity' => $recentActivity,
        'top_programs' => $topPrograms
    ];
    
    echo json_encode($dashboardData);
}
?> 