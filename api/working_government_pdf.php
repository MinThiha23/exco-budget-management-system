<?php
require_once 'config.php';

// Working government PDF generation using proven structure
function generateWorkingGovernmentPDF($programs, $reportType, $startDate, $endDate) {
    // Create a minimal PDF structure that we know works
    $pdf = "%PDF-1.4\n";
    $pdf .= "1 0 obj\n";
    $pdf .= "<<\n";
    $pdf .= "/Type /Catalog\n";
    $pdf .= "/Pages 2 0 R\n";
    $pdf .= ">>\n";
    $pdf .= "endobj\n";
    
    $pdf .= "2 0 obj\n";
    $pdf .= "<<\n";
    $pdf .= "/Type /Pages\n";
    $pdf .= "/Kids [3 0 R]\n";
    $pdf .= "/Count 1\n";
    $pdf .= ">>\n";
    $pdf .= "endobj\n";
    
    // Create page content with simple text positioning
    $content = "BT\n";
    
    // Header - Start at top
    $content .= "50 750 Td\n";
    $content .= "(KEDAH STATE GOVERNMENT LOGO) Tj\n";
    $content .= "0 -30 Td\n";
    $content .= "(SISTEM PENGURUSAN PERUNTUKAN EXCO) Tj\n";
    $content .= "0 -40 Td\n";
    
    // Report details
    $content .= "(Program Report - This report contains programs with approved & rejected status) Tj\n";
    $content .= "0 -25 Td\n";
    
    // Report period
    $periodText = "Report Period: " . date('d/m/Y', strtotime($startDate)) . " to " . date('d/m/Y', strtotime($endDate));
    $content .= "({$periodText}) Tj\n";
    $content .= "0 -40 Td\n";
    
    // Programs section header
    $content .= "(Programs for YAB Dato'Seri Haji Muhammad Sanusi bin Md Nor, SPMK., AMK.) Tj\n";
    $content .= "0 -30 Td\n";
    
    // Table header
    $content .= "(Program Name    Budget    Recipient    Reference    Voucher    EFT    Created    Status) Tj\n";
    $content .= "0 -25 Td\n";
    
    // Separator line
    $content .= "(----------------------------------------------------------------------------------------) Tj\n";
    $content .= "0 -25 Td\n";
    
    // Table data rows
    foreach ($programs as $index => $program) {
        // Get program data
        $title = isset($program['title']) ? substr($program['title'], 0, 15) : 'No Title';
        $budget = isset($program['budget']) ? number_format($program['budget'], 0) : '0';
        $recipient = isset($program['user_name']) ? substr($program['user_name'], 0, 10) : 'N/A';
        $reference = isset($program['letter_reference_number']) ? substr($program['letter_reference_number'], 0, 10) : 'N/A';
        $voucher = isset($program['voucher_number']) ? $program['voucher_number'] : 'N/A';
        $eft = isset($program['eft_number']) ? $program['eft_number'] : 'N/A';
        $created = isset($program['created_at']) ? date('d/m/Y', strtotime($program['created_at'])) : 'N/A';
        $status = isset($program['status']) ? strtoupper($program['status']) : 'UNKNOWN';
        
        // Pad strings to create table-like appearance
        $title = str_pad($title, 15);
        $budget = str_pad($budget, 10);
        $recipient = str_pad($recipient, 12);
        $reference = str_pad($reference, 12);
        $voucher = str_pad($voucher, 10);
        $eft = str_pad($eft, 8);
        $created = str_pad($created, 12);
        
        $line = $title . " " . $budget . " " . $recipient . " " . $reference . " " . $voucher . " " . $eft . " " . $created . " " . $status;
        $content .= "({$line}) Tj\n";
        $content .= "0 -20 Td\n";
    }
    
    // Summary
    $totalBudget = array_sum(array_column($programs, 'budget'));
    $content .= "0 -20 Td\n";
    $content .= "(Total programs: " . count($programs) . " | Total budget: RM " . number_format($totalBudget, 0) . ") Tj\n";
    $content .= "0 -40 Td\n";
    
    // Overall Summary section
    $content .= "(Overall Summary) Tj\n";
    $content .= "0 -25 Td\n";
    $content .= "(Total programs: " . count($programs) . " | Total budget: RM " . number_format($totalBudget, 0) . ") Tj\n";
    
    $content .= "ET\n";
    
    $pdf .= "3 0 obj\n";
    $pdf .= "<<\n";
    $pdf .= "/Type /Page\n";
    $pdf .= "/Parent 2 0 R\n";
    $pdf .= "/MediaBox [0 0 612 792]\n";
    $pdf .= "/Contents 4 0 R\n";
    $pdf .= ">>\n";
    $pdf .= "endobj\n";
    
    $pdf .= "4 0 obj\n";
    $pdf .= "<<\n";
    $pdf .= "/Length " . strlen($content) . "\n";
    $pdf .= ">>\n";
    $pdf .= "stream\n";
    $pdf .= $content;
    $pdf .= "endstream\n";
    $pdf .= "endobj\n";
    
    $pdf .= "xref\n";
    $pdf .= "0 5\n";
    $pdf .= "0000000000 65535 f \n";
    $pdf .= "0000000009 00000 n \n";
    $pdf .= "0000000058 00000 n \n";
    $pdf .= "0000000115 00000 n \n";
    $pdf .= "0000000250 00000 n \n";
    $pdf .= "trailer\n";
    $pdf .= "<<\n";
    $pdf .= "/Size 5\n";
    $pdf .= "/Root 1 0 R\n";
    $pdf .= ">>\n";
    $pdf .= "startxref\n";
    $pdf .= (strlen($pdf) - 1) . "\n";
    $pdf .= "%%EOF\n";
    
    return $pdf;
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
        
        // Generate working government PDF
        $pdfContent = generateWorkingGovernmentPDF($programs, $reportType, $startDate, $endDate);
        
        // Set headers for PDF download
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="working_government_report_' . date('Y-m-d_H-i-s') . '.pdf"');
        header('Content-Length: ' . strlen($pdfContent));
        
        echo $pdfContent;
        
    } catch (Exception $e) {
        error_log("Error generating working government PDF report: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate PDF report']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?> 