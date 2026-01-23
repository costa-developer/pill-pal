import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { ReportData, LogEntry } from '@/hooks/useReports';

interface GeneratePDFOptions {
  reportData: ReportData;
  includeAI: boolean;
  userName?: string;
}

export function generateMedicationReportPDF({ reportData, includeAI, userName }: GeneratePDFOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors matching the app theme
  const primaryColor: [number, number, number] = [0, 119, 182]; // #0077b6
  const darkColor: [number, number, number] = [3, 4, 94]; // #03045e
  const successColor: [number, number, number] = [34, 197, 94];
  const warningColor: [number, number, number] = [234, 179, 8];
  const dangerColor: [number, number, number] = [239, 68, 68];

  let yPosition = 20;

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('MedTrack Report', 15, 25);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const periodLabel = reportData.period === 'weekly' ? 'Weekly Report' : 'Monthly Report';
  doc.text(periodLabel, pageWidth - 15, 20, { align: 'right' });
  doc.text(`${format(new Date(reportData.startDate), 'MMM d, yyyy')} - ${format(new Date(reportData.endDate), 'MMM d, yyyy')}`, pageWidth - 15, 28, { align: 'right' });

  yPosition = 55;

  // User info if available
  if (userName) {
    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.text(`Prepared for: ${userName}`, 15, yPosition);
    yPosition += 8;
  }
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}`, 15, yPosition);
  yPosition += 15;

  // Summary Stats Section
  doc.setTextColor(...darkColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 15, yPosition);
  yPosition += 10;

  // Stats boxes
  const boxWidth = (pageWidth - 40) / 4;
  const boxHeight = 30;
  const stats = [
    { label: 'Medications', value: reportData.totalMedications.toString() },
    { label: 'Doses Taken', value: `${reportData.takenDoses}/${reportData.expectedDoses}` },
    { label: 'Adherence', value: `${reportData.adherenceRate}%` },
    { label: 'Days Tracked', value: reportData.periodDays.toString() },
  ];

  stats.forEach((stat, index) => {
    const x = 15 + (index * (boxWidth + 5));
    
    // Determine color based on stat type
    let boxColor: [number, number, number] = primaryColor;
    if (stat.label === 'Adherence') {
      if (reportData.adherenceRate >= 80) boxColor = successColor;
      else if (reportData.adherenceRate >= 50) boxColor = warningColor;
      else boxColor = dangerColor;
    }
    
    doc.setFillColor(...boxColor);
    doc.roundedRect(x, yPosition, boxWidth, boxHeight, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, x + boxWidth / 2, yPosition + 13, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, x + boxWidth / 2, yPosition + 23, { align: 'center' });
  });

  yPosition += boxHeight + 20;

  // Medication Breakdown Table
  doc.setTextColor(...darkColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Medication Breakdown', 15, yPosition);
  yPosition += 8;

  const tableData = reportData.medicationStats.map(med => [
    med.name,
    med.dosage,
    `${med.taken}/${med.expected}`,
    `${med.adherence}%`,
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Medication', 'Dosage', 'Doses Taken', 'Adherence']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      3: {
        fontStyle: 'bold',
        halign: 'center',
      },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const adherence = parseInt(data.cell.text[0] || '0');
        if (adherence >= 80) {
          data.cell.styles.textColor = successColor;
        } else if (adherence >= 50) {
          data.cell.styles.textColor = warningColor;
        } else {
          data.cell.styles.textColor = dangerColor;
        }
      }
    },
  });

  // Get the final Y position after the table
  yPosition = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || yPosition + 50;
  yPosition += 15;

  // AI Insights Section (if included)
  if (includeAI && reportData.aiInsights) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFillColor(240, 249, 255); // Light blue background
    doc.roundedRect(15, yPosition, pageWidth - 30, 10, 3, 3, 'F');
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('✨ AI Health Insights', 20, yPosition + 7);
    yPosition += 18;

    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Split AI insights into lines that fit the page
    const maxWidth = pageWidth - 40;
    const lines = doc.splitTextToSize(reportData.aiInsights, maxWidth);
    
    lines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });

    yPosition += 10;
  }

  // Full Log Section (for non-AI report or if there's room)
  if (!includeAI || reportData.logs.length <= 20) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setTextColor(...darkColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Medication Log', 15, yPosition);
    yPosition += 8;

    const logData = reportData.logs.slice(0, 50).map((log: LogEntry) => [
      format(new Date(log.taken_at), 'MMM d, yyyy'),
      format(new Date(log.taken_at), 'h:mm a'),
      log.medication?.name || 'Unknown',
      log.scheduled_time,
      log.status === 'taken' ? '✓ Taken' : '✗ Missed',
    ]);

    if (logData.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Time', 'Medication', 'Scheduled', 'Status']],
        body: logData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const status = data.cell.text[0] || '';
            if (status.includes('Taken')) {
              data.cell.styles.textColor = successColor;
            } else {
              data.cell.styles.textColor = dangerColor;
            }
          }
        },
      });
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('No medication logs for this period.', 20, yPosition + 5);
    }
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `MedTrack - Your Health Companion | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  // Generate filename
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const reportType = includeAI ? 'ai-insights' : 'full-log';
  const filename = `medtrack-${reportData.period}-report-${reportType}-${dateStr}.pdf`;

  doc.save(filename);
  return filename;
}
