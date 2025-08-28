<?php
require_once 'config.php';
require_once 'fpdf/fpdf.php';

// Custom FPDF class for government report
class GovernmentReport extends FPDF {
    function Header() {
        // Disable automatic header to prevent logo conflicts
        // We'll add the logo manually in the main function
    }
    
    function AddGovernmentLogo() {
        // Use the actual Kedah government logo PNG
        $pngLogoPath = __DIR__ . '/kedah-logo-png.png';
        
        // Debug: Log to error log
        error_log("AddGovernmentLogo called - PNG path: " . $pngLogoPath);
        error_log("File exists: " . (file_exists($pngLogoPath) ? 'YES' : 'NO'));
        
        // Always try to use the PNG logo first
        if (file_exists($pngLogoPath)) {
            error_log("Attempting to add PNG image...");
            try {
                // Try to add the PNG image directly without complex checks
                // Adjust position for landscape orientation (A4 landscape is 297x210mm)
                $this->Image($pngLogoPath, 10, 10, 30, 30);
                error_log("SUCCESS: PNG image added successfully!");
                return; // Success, exit function
            } catch (Exception $e) {
                error_log("ERROR: FPDF Image() failed: " . $e->getMessage());
            }
        } else {
            error_log("ERROR: PNG file not found!");
        }
        
        // Fallback to text logo if PNG is missing
        error_log("Using fallback text logo");
        $this->SetFont('Arial', 'B', 12);
        $this->SetTextColor(211, 47, 47);
        $this->Text(10, 25, 'KEDAH');
        $this->Text(10, 35, 'GOVERNMENT');
    }
    
    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, 'Page ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}

// Generate FPDF government report
function generateFPDFGovernmentReport($programs, $reportType, $startDate, $endDate) {
    // Create PDF with landscape orientation for better table fit
    $pdf = new GovernmentReport('L', 'mm', 'A4'); // Landscape orientation
    $pdf->AliasNbPages();
    $pdf->AddPage();
    
    // Add logo FIRST - positioned at top-center like in the second image
    $pngLogoPath = __DIR__ . '/kedah-logo-png.png';
    if (file_exists($pngLogoPath)) {
        // Center the logo horizontally (A4 landscape width is 297mm, logo width is 30mm)
        $logoX = (297 - 30) / 2; // Center horizontally
        $pdf->Image($pngLogoPath, $logoX, 10, 30, 30);
    }
    
    // Add header text
    $pdf->SetFont('Arial', 'B', 16);
    $pdf->Cell(0, 10, 'KEDAH STATE GOVERNMENT', 0, 1, 'C');
    $pdf->SetFont('Arial', 'B', 14);
    $pdf->Cell(0, 10, 'SISTEM PENGURUSAN PERUNTUKAN EXCO', 0, 1, 'C');
    $pdf->Ln(10);
    
    $pdf->SetFont('Arial', '', 12);
    
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
    
    // Table header with adjusted column widths for landscape
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
        
        // Handle text overflow with better truncation
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
        
        // Build the SQL query based on report type
        $whereConditions = [];
        $params = [];
        
        if ($reportType === 'approved') {
            $whereConditions[] = "p.status = 'approved'";
            // Filter for Haim Hilman's programs only
            $whereConditions[] = "u.name LIKE '%Haim Hilman%'";
        } elseif ($reportType === 'rejected') {
            $whereConditions[] = "p.status = 'rejected'";
            // Filter for Haim Hilman's programs only
            $whereConditions[] = "u.name LIKE '%Haim Hilman%'";
        } elseif ($reportType === 'both') {
            $whereConditions[] = "(p.status = 'approved' OR p.status = 'rejected')";
            // Filter for Haim Hilman's programs only
            $whereConditions[] = "u.name LIKE '%Haim Hilman%'";
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
        
        // Generate FPDF government report
        $pdfContent = generateFPDFGovernmentReport($programs, $reportType, $startDate, $endDate);
        
        // Set headers for PDF download
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="fpdf_government_report_' . date('Y-m-d_H-i-s') . '.pdf"');
        header('Content-Length: ' . strlen($pdfContent));
        
        echo $pdfContent;
        
    } catch (Exception $e) {
        error_log("Error generating FPDF government report: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate PDF report']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?> 