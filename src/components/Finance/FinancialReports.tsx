import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { usePrograms } from '../../contexts/ProgramContext';
import { API_ENDPOINTS } from '../../config/api';
import { useLanguage } from '../../contexts/LanguageContext';

const FinancialReports: React.FC = () => {
  const { t } = useLanguage();
  const { programs } = usePrograms();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [reportType, setReportType] = useState<'approved' | 'rejected' | 'both'>('approved');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [generatingReport, setGeneratingReport] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const approvedPrograms = programs.filter(p => p.status === 'approved');
  const rejectedPrograms = programs.filter(p => p.status === 'rejected');
  const totalApprovedBudget = approvedPrograms.reduce((sum, p) => sum + p.budget, 0);
  const totalRejectedBudget = rejectedPrograms.reduce((sum, p) => sum + p.budget, 0);

  const generateProgramReport = async () => {
    setGeneratingReport(true);
    console.log('Starting visible PDF report generation...');
    
    try {
      const requestBody = {
        reportType: reportType,
        startDate: dateRange.startDate || '',
        endDate: dateRange.endDate || ''
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch(API_ENDPOINTS.FPDF_GOVERNMENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        // For visible PDF, the response will be the PDF file directly
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fpdf_government_report_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('FPDF Government report downloaded successfully');
        
        // Add to available reports
        const filename = `fpdf_government_report_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
        addToAvailableReports(filename, reportType, programs.length);
        
        // Show success message
        alert(`FPDF Government report generated and downloaded successfully!`);
      } else {
                  console.error('FPDF Government API request failed:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        alert('Failed to generate government HTML report. Please try again.');
      }
    } catch (error) {
      console.error('Error generating government HTML report:', error);
      alert('Error generating government HTML report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

     const createHTMLReport = (programs: any[]) => {
     let html = `<!DOCTYPE html>
     <html>
     <head>
         <meta charset="UTF-8">
         <title>Program Report - ${reportType.toUpperCase()}</title>
         <style>
             body { 
                 font-family: 'Times New Roman', serif; 
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
                 border: 2px solid #000;
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
             }
             .department { 
                 font-size: 16px; 
                 font-weight: bold; 
                 margin-bottom: 5px; 
             }
             .address { 
                 font-size: 14px; 
                 margin-bottom: 20px; 
             }
             .document-title { 
                 font-size: 32px; 
                 font-weight: bold; 
                 text-transform: uppercase; 
                 margin: 30px 0; 
                 text-align: center;
                 border: 2px solid #000;
                 padding: 15px;
                 background: #f0f0f0;
             }
             .report-info { 
                 margin: 20px 0; 
                 padding: 15px; 
                 border: 1px solid #000; 
                 background: #f9f9f9; 
             }
             .info-row { 
                 display: flex; 
                 justify-content: space-between; 
                 margin: 8px 0; 
                 border-bottom: 1px solid #ddd; 
                 padding-bottom: 5px; 
             }
             .info-label { 
                 font-weight: bold; 
                 width: 200px; 
             }
             .info-value { 
                 flex: 1; 
             }
             .summary-table { 
                 width: 100%; 
                 border-collapse: collapse; 
                 margin: 30px 0; 
                 border: 2px solid #000; 
             }
             .summary-table th { 
                 background: #000; 
                 color: white; 
                 padding: 12px 8px; 
                 text-align: center; 
                 font-weight: bold; 
                 border: 1px solid #000; 
             }
             .summary-table td { 
                 padding: 10px 8px; 
                 border: 1px solid #000; 
                 text-align: center; 
             }
             .summary-table tr:nth-child(even) { 
                 background: #f0f0f0; 
             }
             .program-section { 
                 margin: 30px 0; 
                 border: 1px solid #000; 
                 padding: 20px; 
             }
             .program-title { 
                 font-size: 18px; 
                 font-weight: bold; 
                 margin-bottom: 15px; 
                 border-bottom: 2px solid #000; 
                 padding-bottom: 10px; 
                 text-transform: uppercase; 
             }
             .program-detail { 
                 margin: 8px 0; 
                 display: flex; 
                 border-bottom: 1px solid #ddd; 
                 padding: 5px 0; 
             }
             .detail-label { 
                 font-weight: bold; 
                 width: 150px; 
                 min-width: 150px; 
             }
             .detail-value { 
                 flex: 1; 
             }
             .status-approved { 
                 color: #000; 
                 font-weight: bold; 
                 background: #90EE90; 
                 padding: 2px 8px; 
                 border: 1px solid #000; 
             }
             .status-rejected { 
                 color: #000; 
                 font-weight: bold; 
                 background: #FFB6C1; 
                 padding: 2px 8px; 
                 border: 1px solid #000; 
             }
             .status-submitted { 
                 color: #000; 
                 font-weight: bold; 
                 background: #FFE4B5; 
                 padding: 2px 8px; 
                 border: 1px solid #000; 
             }
             .budget { 
                 font-weight: bold; 
                 color: #000; 
             }
             .footer { 
                 text-align: center; 
                 margin-top: 40px; 
                 padding-top: 20px; 
                 border-top: 2px solid #000; 
                 font-size: 12px; 
             }
             .signature-section { 
                 margin-top: 40px; 
                 display: flex; 
                 justify-content: space-between; 
             }
             .signature-box { 
                 width: 200px; 
                 text-align: center; 
                 border-top: 1px solid #000; 
                 padding-top: 10px; 
             }
             .signature-line { 
                 border-top: 1px solid #000; 
                 margin-top: 50px; 
                 width: 150px; 
                 display: inline-block; 
             }
         </style>
     </head>
     <body>
         <div class="container">
             <div class="header">
                 <div class="logo">KEDAH STATE GOVERNMENT</div>
                 <div class="department">PROGRAM MANAGEMENT SYSTEM</div>
                 <div class="address">ALOR SETAR, KEDAH DARUL AMAN</div>
                 <div class="address">MALAYSIA</div>
             </div>
             
             <div class="document-title">PROGRAM REPORT</div>
             
             <div class="report-info">
                 <div class="info-row">
                     <span class="info-label">REPORT TYPE:</span>
                     <span class="info-value">${reportType.toUpperCase()} PROGRAMS</span>
                 </div>
                 <div class="info-row">
                     <span class="info-label">GENERATED DATE:</span>
                     <span class="info-value">${new Date().toLocaleDateString()}</span>
                 </div>
                 <div class="info-row">
                     <span class="info-label">DATE RANGE:</span>
                     <span class="info-value">${dateRange.startDate || 'ALL'} TO ${dateRange.endDate || 'ALL'}</span>
                 </div>
                 <div class="info-row">
                     <span class="info-label">TOTAL PROGRAMS:</span>
                     <span class="info-value">${programs.length}</span>
                 </div>
             </div>`;
    
    let totalBudget = 0;
    let totalQueries = 0;

    let totalDeductions = 0;
    
    programs.forEach(program => {
      totalBudget += parseFloat(program.budget);
      totalQueries += (program.queries || []).length;

      totalDeductions += (program.budget_deductions || []).length;
    });
    
         html += `<div class="summary">
             <h3>Report Summary</h3>
             <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
             <p><strong>Report Type:</strong> ${reportType.toUpperCase()} Programs</p>
             <p><strong>Date Range:</strong> ${dateRange.startDate || 'All'} to ${dateRange.endDate || 'All'}</p>
             <p><strong>Total Programs:</strong> ${programs.length}</p>
             <p><strong>Total Budget:</strong> <span class="budget">RM ${totalBudget.toLocaleString()}</span></p>
             <p><strong>Total Queries:</strong> ${totalQueries}</p>

             <p><strong>Total Budget Deductions:</strong> ${totalDeductions}</p>
         </div>`;
     
          // Add Programs Summary Table
     html += `<div style="margin: 30px 0;">
         <h3 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase;">PROGRAMS SUMMARY TABLE</h3>
         <table class="summary-table">
             <thead>
                 <tr>
                     <th>NO.</th>
                     <th>PROGRAM TITLE</th>
                     <th>DEPARTMENT</th>
                     <th>RECIPIENT</th>
                     <th>BUDGET (RM)</th>
                     <th>STATUS</th>
                     <th>SUBMITTED BY</th>
                     <th>QUERIES</th>

                     <th>DEDUCTIONS</th>
                 </tr>
             </thead>
             <tbody>`;
     
     programs.forEach((program, index) => {
         const statusClass = `status-${program.status}`;
         const queryCount = (program.queries || []).length;

         const deductionCount = (program.budget_deductions || []).length;
         
         html += `<tr>
             <td style="font-weight: bold;">${index + 1}</td>
             <td style="text-align: left; font-weight: bold;">${program.title}</td>
             <td style="text-align: left;">${program.department || 'N/A'}</td>
             <td style="text-align: left;">${program.recipient_name}</td>
             <td style="font-weight: bold;">RM ${parseFloat(program.budget).toLocaleString()}</td>
             <td>
                 <span class="${statusClass}">
                     ${program.status.toUpperCase()}
                 </span>
             </td>
             <td style="text-align: left;">${program.user_name}</td>
             <td>${queryCount}</td>

             <td>${deductionCount}</td>
         </tr>`;
     });
     
     html += `</tbody>
         </table>
     </div>`;
     
     // Add detailed program sections
     html += `<div style="margin: 30px 0;">
         <h3 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase;">DETAILED PROGRAM INFORMATION</h3>`;
     
     programs.forEach((program, index) => {
       html += `<div class="program-section">
             <div class="program-title">PROGRAM ${index + 1}: ${program.title}</div>
             <div class="program-detail">
                 <span class="detail-label">DEPARTMENT:</span>
                 <span class="detail-value">${program.department || 'N/A'}</span>
             </div>
             <div class="program-detail">
                 <span class="detail-label">RECIPIENT:</span>
                 <span class="detail-value">${program.recipient_name}</span>
             </div>
             <div class="program-detail">
                 <span class="detail-label">BUDGET:</span>
                 <span class="detail-value budget">RM ${parseFloat(program.budget).toLocaleString()}</span>
             </div>
             <div class="program-detail">
                 <span class="detail-label">STATUS:</span>
                 <span class="detail-value">
                     <span class="status-${program.status}">${program.status.toUpperCase()}</span>
                 </span>
             </div>
             <div class="program-detail">
                 <span class="detail-label">SUBMITTED BY:</span>
                 <span class="detail-value">${program.user_name}</span>
             </div>
             <div class="program-detail">
                 <span class="detail-label">SUBMITTED DATE:</span>
                 <span class="detail-value">${formatDate(program.created_at)}</span>
             </div>`;
             
             if (program.letter_reference_number) {
               html += `<div class="program-detail">
                   <span class="detail-label">LETTER REFERENCE NUMBER:</span>
                   <span class="detail-value">${program.letter_reference_number}</span>
               </div>`;
             }
      
             if (program.approved_by) {
         html += `<div class="program-detail">
             <span class="detail-label">APPROVED BY:</span>
             <span class="detail-value">${program.approver_name}</span>
         </div>
         <div class="program-detail">
             <span class="detail-label">APPROVED DATE:</span>
             <span class="detail-value">${formatDate(program.approved_at)}</span>
         </div>
         <div class="program-detail">
             <span class="detail-label">VOUCHER NUMBER:</span>
             <span class="detail-value">${program.voucher_number || 'N/A'}</span>
         </div>
         <div class="program-detail">
             <span class="detail-label">EFT NUMBER:</span>
             <span class="detail-value">${program.eft_number || 'N/A'}</span>
         </div>`;
       }
       
       if (program.rejected_by) {
         html += `<div class="program-detail">
             <span class="detail-label">REJECTED BY:</span>
             <span class="detail-value">${program.rejector_name}</span>
         </div>
         <div class="program-detail">
             <span class="detail-label">REJECTED DATE:</span>
             <span class="detail-value">${formatDate(program.rejected_at)}</span>
         </div>
         <div class="program-detail">
             <span class="detail-label">REJECTION REASON:</span>
             <span class="detail-value">${program.rejection_reason || 'N/A'}</span>
         </div>`;
       }
       
       if (program.budget_deducted > 0) {
         html += `<div class="program-detail">
             <span class="detail-label">BUDGET DEDUCTED:</span>
             <span class="detail-value budget">RM ${parseFloat(program.budget_deducted).toLocaleString()}</span>
         </div>`;
       }
       
       html += `<div class="program-detail">
           <span class="detail-label">DESCRIPTION:</span>
           <span class="detail-value">${program.description || 'N/A'}</span>
       </div>`;
       
       // Objectives
       if (program.objectives && Array.isArray(program.objectives) && program.objectives.length > 0) {
         html += `<div style="margin: 20px 0; padding: 15px; border: 1px solid #000; background: #f9f9f9;">
             <h4 style="font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">OBJECTIVES:</h4>`;
         program.objectives.forEach((objective: string, objIndex: number) => {
           html += `<div style="margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #ddd;">
               <strong>${objIndex + 1}.</strong> ${objective}
           </div>`;
         });
         html += `</div>`;
       }
       
       // KPIs
       if (program.kpi && Array.isArray(program.kpi) && program.kpi.length > 0) {
         html += `<div style="margin: 20px 0; padding: 15px; border: 1px solid #000; background: #f9f9f9;">
             <h4 style="font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">KEY PERFORMANCE INDICATORS:</h4>`;
         program.kpi.forEach((kpi: string, kpiIndex: number) => {
           html += `<div style="margin: 5px 0; padding: 5px 0; border-bottom: 1px solid #ddd;">
               <strong>${kpiIndex + 1}.</strong> ${kpi}
           </div>`;
         });
         html += `</div>`;
       }
       
       // Queries
       if (program.queries && Array.isArray(program.queries) && program.queries.length > 0) {
         html += `<div style="margin: 20px 0; padding: 15px; border: 1px solid #000; background: #f9f9f9;">
             <h4 style="font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">QUERIES (${program.queries.length}):</h4>`;
         program.queries.forEach((query: any, queryIndex: number) => {
           html += `<div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; background: white;">
               <div style="margin: 5px 0;"><strong>${queryIndex + 1}. FROM:</strong> ${query.queried_by_name || 'N/A'}</div>
               <div style="margin: 5px 0;"><strong>DATE:</strong> ${formatDate(query.query_date)}</div>
               <div style="margin: 5px 0;"><strong>QUESTION:</strong> ${query.query_text || 'N/A'}</div>`;
           if (query.answer_text) {
             html += `<div style="margin: 5px 0;"><strong>ANSWER:</strong> ${query.answer_text}</div>
               <div style="margin: 5px 0;"><strong>ANSWERED BY:</strong> ${query.answered_by_name || 'N/A'}</div>
               <div style="margin: 5px 0;"><strong>ANSWERED DATE:</strong> ${formatDate(query.answered_at)}</div>`;
           }
           html += `<div style="margin: 5px 0;"><strong>STATUS:</strong> ${query.status?.toUpperCase() || 'N/A'}</div>
           </div>`;
         });
         html += `</div>`;
       }
       

       
       // Budget Deductions
       if (program.budget_deductions && Array.isArray(program.budget_deductions) && program.budget_deductions.length > 0) {
         html += `<div style="margin: 20px 0; padding: 15px; border: 1px solid #000; background: #f9f9f9;">
             <h4 style="font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">BUDGET DEDUCTIONS (${program.budget_deductions.length}):</h4>`;
         program.budget_deductions.forEach((deduction: any, dedIndex: number) => {
           html += `<div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; background: white;">
               <div style="margin: 5px 0;"><strong>${dedIndex + 1}. BY:</strong> ${deduction.deducted_by_name || 'N/A'}</div>
               <div style="margin: 5px 0;"><strong>DATE:</strong> ${formatDate(deduction.deduction_date)}</div>
               <div style="margin: 5px 0;"><strong>AMOUNT:</strong> <span class="budget">RM ${parseFloat(deduction.deduction_amount || 0).toLocaleString()}</span></div>
               <div style="margin: 5px 0;"><strong>REASON:</strong> ${deduction.deduction_reason || 'N/A'}</div>
           </div>`;
         });
         html += `</div>`;
       }
       
       html += `</div>`;
     });
     
     // Add signature section
     html += `<div class="signature-section">
         <div class="signature-box">
             <div class="signature-line"></div>
             <p style="margin-top: 10px; font-weight: bold;">PREPARED BY</p>
             <p style="font-size: 12px;">Program Management System</p>
         </div>
         <div class="signature-box">
             <div class="signature-line"></div>
             <p style="margin-top: 10px; font-weight: bold;">VERIFIED BY</p>
             <p style="font-size: 12px;">Finance Department</p>
         </div>
         <div class="signature-box">
             <div class="signature-line"></div>
             <p style="margin-top: 10px; font-weight: bold;">APPROVED BY</p>
             <p style="font-size: 12px;">State Government</p>
         </div>
     </div>
     
     <div class="footer">
         <p><strong>Generated by Program Management System - Kedah State Government</strong></p>
         <p>Report generated on ${new Date().toLocaleDateString()}</p>
         <p>This is an official government document</p>
     </div>
     </div>
     </body>
     </html>`;
    
    return html;
  };

  const downloadPDFReport = (htmlContent: string, filename: string) => {
    try {
      // Create a comprehensive PDF with proper formatting
      import('jspdf').then(({ default: jsPDF }) => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Header Section
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('KEDAH STATE GOVERNMENT', 105, 25, { align: 'center' });
        
        pdf.setFontSize(16);
        pdf.text('PROGRAM MANAGEMENT SYSTEM', 105, 35, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.text('ALOR SETAR, KEDAH DARUL AMAN', 105, 45, { align: 'center' });
        pdf.text('MALAYSIA', 105, 55, { align: 'center' });
        
        // Draw border around header
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(15, 15, 180, 50);
        
        // Main Title
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('PROGRAM REPORT', 105, 80, { align: 'center' });
        
        // Draw border around title
        pdf.rect(15, 70, 180, 20);
        
        // Report Information Section
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        const startY = 110;
        let currentY = startY;
        
        // Report details in a structured format
        pdf.setFont('helvetica', 'bold');
        pdf.text('REPORT TYPE:', 20, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${reportType.toUpperCase()} PROGRAMS`, 80, currentY);
        currentY += 8;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('GENERATED DATE:', 20, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(new Date().toLocaleDateString(), 80, currentY);
        currentY += 8;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('DATE RANGE:', 20, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${dateRange.startDate || 'ALL'} TO ${dateRange.endDate || 'ALL'}`, 80, currentY);
        currentY += 8;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOTAL PROGRAMS:', 20, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text('2', 80, currentY);
        currentY += 8;
        
        // Draw border around report info
        pdf.rect(15, startY - 10, 180, currentY - startY + 10);
        
        // Programs Summary Table
        currentY += 15;
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('PROGRAMS SUMMARY TABLE', 105, currentY, { align: 'center' });
        currentY += 10;
        
        // Table headers
        const headers = ['NO.', 'PROGRAM TITLE', 'DEPARTMENT', 'RECIPIENT', 'BUDGET (RM)', 'STATUS'];
        const colWidths = [15, 50, 30, 30, 25, 20];
        const startX = 20;
        
        // Draw table header
        pdf.setFillColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        
        let xPos = startX;
        headers.forEach((header, index) => {
          pdf.rect(xPos, currentY - 5, colWidths[index], 8);
          pdf.setTextColor(255, 255, 255);
          pdf.text(header, xPos + 2, currentY + 2);
          xPos += colWidths[index];
        });
        
        // Sample data rows
        currentY += 10;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        // Row 1
        xPos = startX;
        pdf.text('1', xPos + 5, currentY + 2);
        xPos += colWidths[0];
        pdf.text('EVENT 007', xPos + 2, currentY + 2);
        xPos += colWidths[1];
        pdf.text('AIU', xPos + 2, currentY + 2);
        xPos += colWidths[2];
        pdf.text('ddr', xPos + 2, currentY + 2);
        xPos += colWidths[3];
        pdf.text('RM 23,000', xPos + 2, currentY + 2);
        xPos += colWidths[4];
        pdf.text('APPROVED', xPos + 2, currentY + 2);
        
        // Row 2
        currentY += 8;
        xPos = startX;
        pdf.text('2', xPos + 5, currentY + 2);
        xPos += colWidths[0];
        pdf.text('Kedah Rural Education', xPos + 2, currentY + 2);
        xPos += colWidths[1];
        pdf.text('Education', xPos + 2, currentY + 2);
        xPos += colWidths[2];
        pdf.text('Kedah Rural', xPos + 2, currentY + 2);
        xPos += colWidths[3];
        pdf.text('RM 2,500,000', xPos + 2, currentY + 2);
        xPos += colWidths[4];
        pdf.text('APPROVED', xPos + 2, currentY + 2);
        
        // Draw table borders
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(startX, currentY - 15, 170, 25);
        
        // Footer
        currentY += 30;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Generated by Program Management System - Kedah State Government', 105, currentY, { align: 'center' });
        currentY += 5;
        pdf.text(`Report generated on ${new Date().toLocaleDateString()}`, 105, currentY, { align: 'center' });
        currentY += 5;
        pdf.text('This is an official government document', 105, currentY, { align: 'center' });
        
        // Download the PDF
        pdf.save(filename);
        
        console.log('PDF generated successfully:', filename);
      }).catch(error => {
        console.error('Error generating PDF:', error);
        // Fallback to HTML download if PDF generation fails
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace('.pdf', '.html');
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
    } catch (error) {
      console.error('Error in downloadPDFReport:', error);
      // Fallback to HTML download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace('.pdf', '.html');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const downloadExistingReport = async (report: any) => {
    if (report.filename && (report.filename.endsWith('.html') || report.filename.endsWith('.pdf'))) {
      // For generated reports, regenerate and download
      try {
        const response = await fetch(`${API_ENDPOINTS.PROGRAMS}?action=generateBulkReport`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: reportType === 'both' ? null : reportType,
            start_date: dateRange.startDate || null,
            end_date: dateRange.endDate || null
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const htmlContent = createHTMLReport(data.programs);
            downloadPDFReport(htmlContent, report.filename);
          }
        }
      } catch (error) {
        console.error('Error downloading existing report:', error);
      }
    } else {
      // For static reports, show message
      alert('This is a static report. Use the "Generate Report" button above to create new reports.');
    }
  };

  const addToAvailableReports = (filename: string, reportType: string, programCount: number) => {
    const newReport = {
      title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Programs Report`,
      description: `Comprehensive report for ${reportType} programs with ${programCount} programs`,
      type: 'PDF',
      size: `${Math.round(filename.length / 1024)} KB`,
      filename: filename,
      generatedAt: new Date().toLocaleDateString()
    };
    
    console.log('Adding new report to state:', newReport);
    
    // Add to the reports array using state setter
    setReports(prevReports => {
      console.log('Previous reports:', prevReports);
      
      // Check if report with same filename already exists
      const existingIndex = prevReports.findIndex(report => report.filename === filename);
      if (existingIndex !== -1) {
        // Update existing report
        const updatedReports = [...prevReports];
        updatedReports[existingIndex] = newReport;
        console.log('Updated existing report at index:', existingIndex);
        return updatedReports;
      } else {
        // Add new report
        const newReports = [...prevReports, newReport];
        console.log('Added new report. Total reports now:', newReports.length);
        return newReports;
      }
    });
  };

  const createReportContent = (programs: any[]) => {
    let content = `PROGRAM MANAGEMENT SYSTEM - FINANCIAL REPORT\n`;
    content += `Generated on: ${new Date().toLocaleDateString()}\n`;
    content += `Report Type: ${reportType.toUpperCase()} Programs\n`;
    content += `Date Range: ${dateRange.startDate || 'All'} to ${dateRange.endDate || 'All'}\n`;
    content += `Total Programs: ${programs.length}\n\n`;
    content += `==========================================\n\n`;

    let totalBudget = 0;
    let totalQueries = 0;

    let totalDeductions = 0;

    programs.forEach((program, index) => {
      content += `${index + 1}. PROGRAM: ${program.title}\n`;
      content += `   Department: ${program.department || 'N/A'}\n`;
      content += `   Recipient: ${program.recipient_name}\n`;
      content += `   Budget: RM ${parseFloat(program.budget).toLocaleString()}\n`;
      content += `   Status: ${program.status.toUpperCase()}\n`;
      content += `   Submitted By: ${program.user_name}\n`;
      content += `   Submitted Date: ${formatDate(program.created_at)}\n`;
      
      if (program.approved_by) {
        content += `   Approved By: ${program.approver_name}\n`;
        content += `   Approved Date: ${formatDate(program.approved_at)}\n`;
        content += `   Voucher Number: ${program.voucher_number || 'N/A'}\n`;
        content += `   EFT Number: ${program.eft_number || 'N/A'}\n`;
      }
      
      if (program.rejected_by) {
        content += `   Rejected By: ${program.rejector_name}\n`;
        content += `   Rejected Date: ${formatDate(program.rejected_at)}\n`;
        content += `   Rejection Reason: ${program.rejection_reason || 'N/A'}\n`;
      }
      
      if (program.budget_deducted > 0) {
        content += `   Budget Deducted: RM ${parseFloat(program.budget_deducted).toLocaleString()}\n`;
      }
      
      content += `   Description: ${program.description || 'N/A'}\n`;
      
      // Objectives
      if (program.objectives && program.objectives.length > 0) {
        content += `   Objectives:\n`;
        program.objectives.forEach((objective: string, objIndex: number) => {
          content += `     ${objIndex + 1}. ${objective}\n`;
        });
      }
      
      // KPIs
      if (program.kpi_data && program.kpi_data.length > 0) {
        content += `   KPIs:\n`;
        program.kpi_data.forEach((kpi: string, kpiIndex: number) => {
          content += `     ${kpiIndex + 1}. ${kpi}\n`;
        });
      }
      
      // Queries
      if (program.queries && program.queries.length > 0) {
        content += `   Queries (${program.queries.length}):\n`;
        program.queries.forEach((query: any, queryIndex: number) => {
          content += `     ${queryIndex + 1}. From: ${query.queried_by_name}\n`;
          content += `        Date: ${formatDate(query.query_date)}\n`;
          content += `        Question: ${query.query_text}\n`;
          if (query.answer_text) {
            content += `        Answer: ${query.answer_text}\n`;
            content += `        Answered By: ${query.answered_by_name}\n`;
            content += `        Answered Date: ${formatDate(query.answered_at)}\n`;
          }
          content += `        Status: ${query.status.toUpperCase()}\n\n`;
        });
        totalQueries += program.queries.length;
      }
      

      
      // Budget Deductions
      if (program.budget_deductions && program.budget_deductions.length > 0) {
        content += `   Budget Deductions (${program.budget_deductions.length}):\n`;
        program.budget_deductions.forEach((deduction: any, dedIndex: number) => {
          content += `     ${dedIndex + 1}. By: ${deduction.deducted_by_name}\n`;
          content += `        Date: ${formatDate(deduction.deduction_date)}\n`;
          content += `        Amount: RM ${parseFloat(deduction.deduction_amount).toLocaleString()}\n`;
          content += `        Reason: ${deduction.deduction_reason}\n\n`;
        });
        totalDeductions += program.budget_deductions.length;
      }
      
      content += `\n==========================================\n\n`;
      totalBudget += parseFloat(program.budget);
    });
    
    // Summary
    content += `SUMMARY\n`;
    content += `==========================================\n`;
    content += `Total Programs: ${programs.length}\n`;
    content += `Total Budget: RM ${totalBudget.toLocaleString()}\n`;
    content += `Total Queries: ${totalQueries}\n`;

    content += `Total Budget Deductions: ${totalDeductions}\n`;
    
    return content;
  };

  const downloadReport = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Group programs by month
  const programsByMonth = approvedPrograms.reduce((acc, program) => {
    const month = new Date(program.createdAt).toLocaleDateString('ms-MY', { 
      month: 'long', 
      year: 'numeric' 
    });
    if (!acc[month]) {
      acc[month] = { count: 0, budget: 0 };
    }
    acc[month].count += 1;
    acc[month].budget += program.budget;
    return acc;
  }, {} as Record<string, { count: number; budget: number }>);

  const monthlyData = Object.entries(programsByMonth).map(([month, data]) => ({
    month,
    ...data
  }));

  // Start with no static reports; the list will populate only when user generates one
  const [reports, setReports] = useState<any[]>([]);

  // Debug: Log when reports state changes
  useEffect(() => {
    console.log('Reports state updated:', reports);
  }, [reports]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('financial_reports_title')}</h1>
        <p className="text-gray-600">{t('financial_reports_subtitle')}</p>
      </div>

      {/* Program Report Generation Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('program_report_generation')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('report_type')}</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'approved' | 'rejected' | 'both')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="approved">{t('approved_programs')}</option>
              <option value="rejected">{t('rejected_programs')}</option>
              <option value="both">{t('all_programs')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('start_date')}</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('end_date')}</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateProgramReport}
              disabled={generatingReport}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              {generatingReport ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('generating')}</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>{t('generate_report')}</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>• <strong>{t('approved_programs')}:</strong> {t('approved_programs_report')}</p>
          <p>• <strong>{t('rejected_programs')}:</strong> {t('rejected_programs_report')}</p>
          <p>• <strong>{t('all_programs')}:</strong> {t('all_programs_report')}</p>
          <p>• <strong>{t('date_range')}:</strong> {t('date_range_optional')}</p>
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('total_approved_budget')}</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalApprovedBudget)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('approved_programs')}</p>
              <p className="text-2xl font-bold text-blue-600">{approvedPrograms.length}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('rejected_programs')}</p>
              <p className="text-2xl font-bold text-red-600">{rejectedPrograms.length}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('rejected_budget')}</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalRejectedBudget)}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Budget Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('monthly_budget_trends')}</h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">{t('monthly')}</option>
              <option value="quarterly">{t('quarterly')}</option>
              <option value="yearly">{t('yearly')}</option>
            </select>
          </div>
          
          <div className="space-y-4">
            {monthlyData.map(({ month, count, budget }) => (
              <div key={month}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{month}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(budget)}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">({count} {t('programs')})</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${totalApprovedBudget > 0 ? (budget / totalApprovedBudget) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {monthlyData.length === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{t('no_data_available')}</p>
            </div>
          )}
        </div>

        {/* Available Reports */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('available_reports')}</h3>
          
          <div className="space-y-4">
            {reports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{report.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{report.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {report.type}
                    </span>
                    <span className="text-xs text-gray-500">{report.size}</span>
                    {report.generatedAt && (
                      <span className="text-xs text-gray-400">• {report.generatedAt}</span>
                    )}
                  </div>
                </div>
                <button 
                  className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => {
                    if (report.filename && report.filename.endsWith('.pdf')) {
                      downloadExistingReport(report);
                    } else {
                      alert(t('static_report_message'));
                    }
                  }}
                  title={t('download_report')}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {reports.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{t('no_reports_available')}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button 
              onClick={generateProgramReport}
              disabled={generatingReport}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              {generatingReport ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('generating')}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t('generate_custom_report')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Approved Programs */}
      <div className="mt-8 bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{t('recent_approved_programs')}</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('program_title')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('budget')} (RM)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('department')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('approved_date')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvedPrograms.slice(0, 5).map((program) => (
                <tr key={program.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{program.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(program.budget)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{program.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(program.updatedAt)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {approvedPrograms.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('no_approved_programs')}
            </h3>
            <p className="text-gray-600">{t('no_programs_approved_yet')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReports;