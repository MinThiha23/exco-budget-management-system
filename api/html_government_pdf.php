<?php
require_once 'config.php';

// HTML-based government PDF generation
function generateHTMLGovernmentPDF($programs, $reportType, $startDate, $endDate) {
    // Create HTML content
    $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Program Report</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white; 
            color: #000;
            line-height: 1.4;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #000; 
            padding-bottom: 20px; 
        }
        .logo { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px; 
            color: #d32f2f;
        }
        .title { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 10px; 
            text-transform: uppercase;
        }
        .report-info { 
            margin: 20px 0; 
            padding: 15px; 
            border: 1px solid #000; 
            background: #f9f9f9; 
        }
        .info-row { 
            margin: 8px 0; 
            border-bottom: 1px solid #ddd; 
            padding-bottom: 5px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
        }
        th, td { 
            border: 1px solid #000; 
            padding: 8px; 
            text-align: left; 
        }
        th { 
            background-color: #f0f0f0; 
            font-weight: bold; 
        }
        .summary { 
            margin-top: 30px; 
            padding: 15px; 
            border: 2px solid #000; 
            background: #f9f9f9; 
        }
        .summary h3 { 
            margin-top: 0; 
            color: #d32f2f;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="#d32f2f" stroke="#000" stroke-width="1"/>
                    <circle cx="50" cy="50" r="35" fill="#ffeb3b" stroke="#000" stroke-width="1"/>
                    <circle cx="50" cy="50" r="25" fill="#d32f2f" stroke="#000" stroke-width="1"/>
                    <polygon points="50,30 55,40 65,40 59,47 61,57 50,52 39,57 41,47 35,40 45,40" fill="#ffeb3b"/>
                    <text x="50" y="70" text-anchor="middle" font-family="Arial" font-size="8" font-weight="bold" fill="#000">KEDAH</text>
                    <text x="50" y="80" text-anchor="middle" font-family="Arial" font-size="6" fill="#000">GOVERNMENT</text>
                </svg>
            </div>
            <div class="title">SISTEM PENGURUSAN PERUNTUKAN EXCO</div>
        </div>
        
        <div class="report-info">
            <div class="info-row"><strong>Program Report:</strong> This report contains programs with approved status only</div>
            <div class="info-row"><strong>Report Period:</strong> ' . date('d/m/Y', strtotime($startDate)) . ' to ' . date('d/m/Y', strtotime($endDate)) . '</div>
            <div class="info-row"><strong>Programs for:</strong> YAB Dato\'Seri Haji Muhammad Sanusi bin Md Nor, SPMK., AMK.</div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Program Name</th>
                    <th>Budget</th>
                    <th>Recipient</th>
                    <th>Reference</th>
                    <th>Voucher</th>
                    <th>EFT</th>
                    <th>Created</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>';
    
    foreach ($programs as $program) {
        $title = isset($program['title']) ? htmlspecialchars($program['title']) : 'No Title';
        $budget = isset($program['budget']) ? 'RM ' . number_format($program['budget'], 2) : 'RM 0.00';
        $recipient = isset($program['user_name']) ? htmlspecialchars($program['user_name']) : 'N/A';
        $reference = isset($program['letter_reference_number']) ? htmlspecialchars($program['letter_reference_number']) : 'N/A';
        $voucher = isset($program['voucher_number']) ? htmlspecialchars($program['voucher_number']) : 'N/A';
        $eft = isset($program['eft_number']) ? htmlspecialchars($program['eft_number']) : 'N/A';
        $created = isset($program['created_at']) ? date('d/m/Y', strtotime($program['created_at'])) : 'N/A';
        $status = isset($program['status']) ? strtoupper($program['status']) : 'UNKNOWN';
        
        $html .= '<tr>
                    <td>' . $title . '</td>
                    <td>' . $budget . '</td>
                    <td>' . $recipient . '</td>
                    <td>' . $reference . '</td>
                    <td>' . $voucher . '</td>
                    <td>' . $eft . '</td>
                    <td>' . $created . '</td>
                    <td>' . $status . '</td>
                </tr>';
    }
    
    $totalBudget = array_sum(array_column($programs, 'budget'));
    
    $html .= '</tbody>
        </table>
        
        <div class="summary">
            <h3>Overall Summary</h3>
            <p><strong>Total programs:</strong> ' . count($programs) . ' | <strong>Total budget:</strong> RM ' . number_format($totalBudget, 2) . '</p>
        </div>
    </div>
</body>
</html>';
    
    return $html;
}

// Handle the report generation
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $pdo = getConnection();
        
        $input = json_decode(file_get_contents('php://input'), true);
        $reportType = $input['reportType'] ?? 'all';
        $startDate = $input['startDate'] ?? '';
        $endDate = $input['endDate'] ?? '';
        
        // Build the SQL query based on report type
        $whereConditions = [];
        $params = [];
        
        if ($reportType === 'approved') {
            $whereConditions[] = "p.status = 'approved'";
        } elseif ($reportType === 'rejected') {
            $whereConditions[] = "p.status = 'rejected'";
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
        
        // Generate HTML government report
        $htmlContent = generateHTMLGovernmentPDF($programs, $reportType, $startDate, $endDate);
        
        // Set headers for HTML download (can be converted to PDF by browser)
        header('Content-Type: text/html');
        header('Content-Disposition: attachment; filename="government_report_' . date('Y-m-d_H-i-s') . '.html"');
        header('Content-Length: ' . strlen($htmlContent));
        
        echo $htmlContent;
        
    } catch (Exception $e) {
        error_log("Error generating HTML government report: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate report']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?> 