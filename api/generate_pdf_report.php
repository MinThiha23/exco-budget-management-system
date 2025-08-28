<?php
require_once 'config.php';
require_once 'fpdf/fpdf.php';

class ProgramReport extends FPDF {
    function Header() {
        // Logo - Kedah State Government
        $this->SetFont('Arial', 'B', 16);
        $this->Cell(0, 10, 'KEDAH STATE GOVERNMENT', 0, 1, 'C');
        $this->SetFont('Arial', 'B', 14);
        $this->Cell(0, 8, 'PROGRAM MANAGEMENT SYSTEM', 0, 1, 'C');
        $this->SetFont('Arial', '', 12);
        $this->Cell(0, 8, 'Program Report', 0, 1, 'C');
        $this->Ln(10);
    }

    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, 'Page ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }

    function ChapterTitle($title) {
        $this->SetFont('Arial', 'B', 12);
        $this->SetFillColor(200, 220, 255);
        $this->Cell(0, 6, $title, 0, 1, 'L', true);
        $this->Ln(4);
    }

    function ProgramTable($programs, $reportType) {
        $this->SetFont('Arial', 'B', 10);
        
        // Table header
        $this->SetFillColor(240, 240, 240);
        $this->Cell(40, 7, 'Program ID', 1, 0, 'C', true);
        $this->Cell(60, 7, 'Title', 1, 0, 'C', true);
        $this->Cell(30, 7, 'Status', 1, 0, 'C', true);
        $this->Cell(30, 7, 'Budget', 1, 0, 'C', true);
        $this->Cell(30, 7, 'Date', 1, 1, 'C', true);

        $this->SetFont('Arial', '', 9);
        
        foreach ($programs as $program) {
            $this->Cell(40, 6, $program['id'], 1, 0, 'C');
            $this->Cell(60, 6, substr($program['title'], 0, 25) . (strlen($program['title']) > 25 ? '...' : ''), 1, 0, 'L');
            $this->Cell(30, 6, ucfirst($program['status']), 1, 0, 'C');
            $this->Cell(30, 6, 'RM ' . number_format($program['budget'], 0), 1, 0, 'R');
            $this->Cell(30, 6, date('d/m/Y', strtotime($program['created_at'])), 1, 1, 'C');
        }
    }

    function ProgramDetails($program) {
        $this->SetFont('Arial', 'B', 11);
        $this->Cell(0, 8, 'Program Details', 0, 1, 'L');
        $this->SetFont('Arial', '', 10);
        
        $this->Cell(40, 6, 'Title:', 0, 0, 'L');
        $this->Cell(0, 6, $program['title'], 0, 1, 'L');
        
        $this->Cell(40, 6, 'Description:', 0, 0, 'L');
        $this->MultiCell(0, 6, $program['description'], 0, 'L');
        
        $this->Cell(40, 6, 'Budget:', 0, 0, 'L');
        $this->Cell(0, 6, 'RM ' . number_format($program['budget'], 0), 0, 1, 'L');
        
        $this->Cell(40, 6, 'Status:', 0, 0, 'L');
        $this->Cell(0, 6, ucfirst($program['status']), 0, 1, 'L');
        
        $this->Cell(40, 6, 'Created:', 0, 0, 'L');
        $this->Cell(0, 6, date('d/m/Y H:i', strtotime($program['created_at'])), 0, 1, 'L');
        
        if ($program['submitted_at']) {
            $this->Cell(40, 6, 'Submitted:', 0, 0, 'L');
            $this->Cell(0, 6, date('d/m/Y H:i', strtotime($program['submitted_at'])), 0, 1, 'L');
        }
        
        if ($program['approved_at']) {
            $this->Cell(40, 6, 'Approved:', 0, 0, 'L');
            $this->Cell(0, 6, date('d/m/Y H:i', strtotime($program['approved_at'])), 0, 1, 'L');
            
            if ($program['voucher_number']) {
                $this->Cell(40, 6, 'Voucher No:', 0, 0, 'L');
                $this->Cell(0, 6, $program['voucher_number'], 0, 1, 'L');
            }
            
            if ($program['eft_number']) {
                $this->Cell(40, 6, 'EFT Number:', 0, 0, 'L');
                $this->Cell(0, 6, $program['eft_number'], 0, 1, 'L');
            }
        }
        
        if ($program['rejected_at']) {
            $this->Cell(40, 6, 'Rejected:', 0, 0, 'L');
            $this->Cell(0, 6, date('d/m/Y H:i', strtotime($program['rejected_at'])), 0, 1, 'L');
            
            if ($program['rejection_reason']) {
                $this->Cell(40, 6, 'Reason:', 0, 0, 'L');
                $this->MultiCell(0, 6, $program['rejection_reason'], 0, 'L');
            }
        }
        
        if ($program['letter_reference_number']) {
            $this->Cell(40, 6, 'Letter Ref:', 0, 0, 'L');
            $this->Cell(0, 6, $program['letter_reference_number'], 0, 1, 'L');
        }
    }
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
        
        // Generate PDF
        $pdf = new ProgramReport();
        $pdf->AliasNbPages();
        $pdf->AddPage();
        
        // Report title
        $pdf->SetFont('Arial', 'B', 16);
        $reportTitle = ucfirst($reportType) . ' Programs Report';
        if ($startDate && $endDate) {
            $reportTitle .= ' (' . date('d/m/Y', strtotime($startDate)) . ' - ' . date('d/m/Y', strtotime($endDate)) . ')';
        }
        $pdf->Cell(0, 10, $reportTitle, 0, 1, 'C');
        $pdf->Ln(5);
        
        // Summary
        $pdf->ChapterTitle('Summary');
        $pdf->SetFont('Arial', '', 10);
        $pdf->Cell(0, 6, 'Total Programs: ' . count($programs), 0, 1, 'L');
        
        $totalBudget = array_sum(array_column($programs, 'budget'));
        $pdf->Cell(0, 6, 'Total Budget: RM ' . number_format($totalBudget, 0), 0, 1, 'L');
        
        $approvedCount = count(array_filter($programs, fn($p) => $p['status'] === 'approved'));
        $rejectedCount = count(array_filter($programs, fn($p) => $p['status'] === 'rejected'));
        $pendingCount = count(array_filter($programs, fn($p) => $p['status'] === 'submitted'));
        
        $pdf->Cell(0, 6, 'Approved: ' . $approvedCount, 0, 1, 'L');
        $pdf->Cell(0, 6, 'Rejected: ' . $rejectedCount, 0, 1, 'L');
        $pdf->Cell(0, 6, 'Pending: ' . $pendingCount, 0, 1, 'L');
        $pdf->Ln(5);
        
        // Programs table
        if (!empty($programs)) {
            $pdf->ChapterTitle('Programs Overview');
            $pdf->ProgramTable($programs, $reportType);
            $pdf->Ln(10);
            
            // Detailed program information
            $pdf->ChapterTitle('Detailed Program Information');
            foreach ($programs as $program) {
                $pdf->ProgramDetails($program);
                $pdf->Ln(5);
                
                // Add page break if needed
                if ($pdf->GetY() > 250) {
                    $pdf->AddPage();
                }
            }
        } else {
            $pdf->SetFont('Arial', '', 12);
            $pdf->Cell(0, 10, 'No programs found for the selected criteria.', 0, 1, 'C');
        }
        
        // Generate filename
        $timestamp = date('Y-m-d_H-i-s');
        $filename = $reportType . '_programs_report_' . $timestamp . '.pdf';
        
        // Output PDF
        $pdf->Output('D', $filename);
        
    } catch (Exception $e) {
        error_log("Error generating PDF report: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate PDF report']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?> 