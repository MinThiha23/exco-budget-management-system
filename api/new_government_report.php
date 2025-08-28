<?php
require_once 'config.php';
require_once 'fpdf/fpdf.php';

// New government report with guaranteed logo and user filter
class NewGovernmentReport extends FPDF {
    function Header() {
        // Disable automatic header
    }
    
    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, 'Page ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

// Generate new government report
function generateNewGovernmentReport($programs, $reportType, $startDate, $endDate) {
    // Create PDF with landscape orientation
    $pdf = new NewGovernmentReport('L', 'mm', 'A4');
    $pdf->AliasNbPages();
    $pdf->AddPage();
    
    // Add logo FIRST - positioned at top-center like in the second image
    $pngLogoPath = __DIR__ . '/kedah-logo-png.png';
    if (file_exists($pngLogoPath)) {
        // Center the logo horizontally (A4 landscape width is 297mm, logo width is 30mm)
        $logoX = (297 - 30) / 2; // Center horizontally
        $pdf->Image($pngLogoPath, $logoX, 10, 30, 30);
    }
    
    // Add header text below the logo
    $pdf->SetFont('Arial', 'B', 16);
    $pdf->Cell(0, 10, 'KEDAH STATE GOVERNMENT', 0, 1, 'C');
    $pdf->SetFont('Arial', 'B', 14);
    $pdf->Cell(0, 10, 'SISTEM PENGURUSAN PERUNTUKAN EXCO', 0, 1, 'C');
    $pdf->Ln(10);
    
    // Report details
    $pdf->SetFont('Arial', 'B', 12);
    $reportTitle = '';
    if ($reportType === 'approved') {
        $reportTitle = 'Program Report - This report contains programs with approved status only';
    } elseif ($reportType === 'rejected') {
        $reportTitle = 'Program Report - This report contains programs with rejected status only';
    } elseif ($reportType === 'both') {
        $reportTitle = 'Program Report - This report contains programs with approved and rejected status';
    } else {
        $reportTitle = 'Program Report - This report contains all programs';
    }
    $pdf->Cell(0, 10, $reportTitle, 0, 1);
    $pdf->SetFont('Arial', '', 10);
    $pdf->Cell(0, 8, 'Report Period: ' . date('d/m/Y', strtotime($startDate)) . ' to ' . date('d/m/Y', strtotime($endDate)), 0, 1);
    $pdf->Cell(0, 8, 'Programs for: YAB Dato\'Seri Haji Muhammad Sanusi bin Md Nor, SPMK., AMK.', 0, 1);
    $pdf->Ln(10);
    
    // Table header
    $pdf->SetFont('Arial', 'B', 9);
    $pdf->SetFillColor(240, 240, 240);
    $pdf->Cell(50, 8, 'Program Name', 1, 0, 'C', true);
    $pdf->Cell(30, 8, 'Budget', 1, 0, 'C', true);
    $pdf->Cell(30, 8, 'Recipient', 1, 0, 'C', true);
    $pdf->Cell(30, 8, 'Reference', 1, 0, 'C', true);
    $pdf->Cell(30, 8, 'Voucher', 1, 0, 'C', true);
    $pdf->Cell(30, 8, 'EFT', 1, 0, 'C', true);
    $pdf->Cell(25, 8, 'Created', 1, 0, 'C', true);
    $pdf->Cell(25, 8, 'Status', 1, 1, 'C', true);
    
    // Table data
    $pdf->SetFont('Arial', '', 8);
    foreach ($programs as $program) {
        $title = isset($program['title']) ? $program['title'] : 'No Title';
        $budget = isset($program['budget']) ? 'RM ' . number_format($program['budget'], 2) : 'RM 0.00';
        $recipient = isset($program['user_name']) ? $program['user_name'] : 'N/A';
        $reference = isset($program['letter_reference_number']) ? $program['letter_reference_number'] : 'N/A';
        $voucher = isset($program['voucher_number']) ? $program['voucher_number'] : 'N/A';
        $eft = isset($program['eft_number']) ? $program['eft_number'] : 'N/A';
        $created = isset($program['created_at']) ? date('d/m/Y', strtotime($program['created_at'])) : 'N/A';
        $status = isset($program['status']) ? strtoupper($program['status']) : 'UNKNOWN';
        
        // Handle text overflow
        $title = strlen($title) > 20 ? substr($title, 0, 17) . '...' : $title;
        $recipient = strlen($recipient) > 12 ? substr($recipient, 0, 9) . '...' : $recipient;
        $reference = strlen($reference) > 12 ? substr($reference, 0, 9) . '...' : $reference;
        $voucher = strlen($voucher) > 12 ? substr($voucher, 0, 9) . '...' : $voucher;
        $eft = strlen($eft) > 12 ? substr($eft, 0, 9) . '...' : $eft;
        
        $pdf->Cell(50, 8, $title, 1, 0, 'L');
        $pdf->Cell(30, 8, $budget, 1, 0, 'R');
        $pdf->Cell(30, 8, $recipient, 1, 0, 'L');
        $pdf->Cell(30, 8, $reference, 1, 0, 'L');
        $pdf->Cell(30, 8, $voucher, 1, 0, 'L');
        $pdf->Cell(30, 8, $eft, 1, 0, 'L');
        $pdf->Cell(25, 8, $created, 1, 0, 'C');
        $pdf->Cell(25, 8, $status, 1, 1, 'C');
    }
    
    // Summary
    $totalBudget = array_sum(array_column($programs, 'budget'));
    $pdf->Ln(10);
    $pdf->SetFont('Arial', 'B', 12);
    $pdf->Cell(0, 10, 'Overall Summary', 0, 1);
    $pdf->SetFont('Arial', '', 10);
    $pdf->Cell(0, 8, 'Total programs: ' . count($programs) . ' | Total budget: RM ' . number_format($totalBudget, 2), 0, 1);
    
    return $pdf->Output('S');
}

// Handle the report generation
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $pdo = getConnection();
        
        $input = json_decode(file_get_contents('php://input'), true);
        $reportType = $input['reportType'] ?? 'all';
        $startDate = $input['startDate'] ?? '';
        $endDate = $input['endDate'] ?? '';
        
        // Build the SQL query with Haim Hilman filter
        $whereConditions = [];
        $params = [];
        
        if ($reportType === 'approved') {
            $whereConditions[] = "p.status = 'approved'";
        } elseif ($reportType === 'rejected') {
            $whereConditions[] = "p.status = 'rejected'";
        } elseif ($reportType === 'both') {
            $whereConditions[] = "(p.status = 'approved' OR p.status = 'rejected')";
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
        
        // Generate new government report
        $pdfContent = generateNewGovernmentReport($programs, $reportType, $startDate, $endDate);
        
        // Set headers for PDF download
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="new_government_report_' . date('Y-m-d_H-i-s') . '.pdf"');
        header('Content-Length: ' . strlen($pdfContent));
        
        echo $pdfContent;
        
    } catch (Exception $e) {
        error_log("Error generating new government report: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate PDF report']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
