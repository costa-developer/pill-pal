import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, isSameDay, isBefore, startOfDay, isToday } from 'date-fns';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_of_day: string[];
  color: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface MedicationLog {
  id: string;
  medication_id: string;
  taken_at: string;
  scheduled_time: string;
  status: string;
}

interface GenerateCalendarPDFOptions {
  medications: Medication[];
  weekDays: Date[];
  logs: MedicationLog[];
  userName?: string;
}

const TIME_SLOTS = [
  { key: 'Morning (8:00 AM)', label: 'Morning', time: '8:00 AM' },
  { key: 'Noon (12:00 PM)', label: 'Noon', time: '12:00 PM' },
  { key: 'Afternoon (3:00 PM)', label: 'Afternoon', time: '3:00 PM' },
  { key: 'Evening (6:00 PM)', label: 'Evening', time: '6:00 PM' },
  { key: 'Night (9:00 PM)', label: 'Night', time: '9:00 PM' },
  { key: 'Bedtime (10:00 PM)', label: 'Bedtime', time: '10:00 PM' },
];

export function generateWeeklyCalendarPDF({ medications, weekDays, logs, userName }: GenerateCalendarPDFOptions) {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor: [number, number, number] = [0, 119, 182];
  const darkColor: [number, number, number] = [3, 4, 94];
  const successColor: [number, number, number] = [34, 197, 94];
  const dangerColor: [number, number, number] = [239, 68, 68];

  // Helper functions
  const wasTaken = (medicationId: string, day: Date, timeSlot: string): boolean => {
    return logs.some(
      (log) =>
        log.medication_id === medicationId &&
        log.scheduled_time === timeSlot &&
        log.status === 'taken' &&
        isSameDay(new Date(log.taken_at), day)
    );
  };

  const isScheduledForDay = (medication: Medication, day: Date): boolean => {
    const startDate = medication.start_date ? startOfDay(new Date(medication.start_date)) : null;
    const endDate = medication.end_date ? startOfDay(new Date(medication.end_date)) : null;
    const dayStart = startOfDay(day);

    if (!startDate) return true;
    if (isBefore(dayStart, startDate)) return false;
    if (endDate && isBefore(endDate, dayStart)) return false;

    return true;
  };

  const getMedicationsForTimeSlot = (timeSlotKey: string): Medication[] => {
    return medications.filter((med) => med.time_of_day.includes(timeSlotKey));
  };

  let yPosition = 20;

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Weekly Medication Schedule', 15, 22);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const weekRange = `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`;
  doc.text(weekRange, pageWidth - 15, 22, { align: 'right' });

  yPosition = 45;

  // User info
  if (userName) {
    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.text(`Prepared for: ${userName}`, 15, yPosition);
    yPosition += 6;
  }

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}`, 15, yPosition);
  yPosition += 12;

  // Build table data
  const dayHeaders = ['Time / Medication', ...weekDays.map(d => format(d, 'EEE\nMMM d'))];

  TIME_SLOTS.forEach((slot) => {
    const medsForSlot = getMedicationsForTimeSlot(slot.key);
    if (medsForSlot.length === 0) return;

    // Check if we need a new page
    if (yPosition > 170) {
      doc.addPage('landscape');
      yPosition = 20;
    }

    // Time slot header
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(15, yPosition, pageWidth - 30, 8, 2, 2, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${slot.label} (${slot.time})`, 20, yPosition + 5.5);
    yPosition += 12;

    // Table for this time slot
    const tableData = medsForSlot.map((med) => {
      const row = [`${med.name}\n(${med.dosage})`];

      weekDays.forEach((day) => {
        const scheduled = isScheduledForDay(med, day);
        const taken = wasTaken(med.id, day, slot.key);
        const isPast = isBefore(startOfDay(day), startOfDay(new Date())) && !isToday(day);

        if (!scheduled) {
          row.push('—');
        } else if (taken) {
          row.push('✓ Taken');
        } else if (isPast) {
          row.push('✗ Missed');
        } else if (isToday(day)) {
          row.push('● Today');
        } else {
          row.push('○ Scheduled');
        }
      });

      return row;
    });

    autoTable(doc, {
      startY: yPosition,
      head: [dayHeaders],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        valign: 'middle',
        cellPadding: 3,
      },
      styles: {
        fontSize: 8,
        cellPadding: 4,
        valign: 'middle',
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left', cellWidth: 45 },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index > 0) {
          const text = data.cell.text[0] || '';
          if (text.includes('Taken')) {
            data.cell.styles.textColor = successColor;
            data.cell.styles.fontStyle = 'bold';
          } else if (text.includes('Missed')) {
            data.cell.styles.textColor = dangerColor;
            data.cell.styles.fontStyle = 'bold';
          } else if (text.includes('Today')) {
            data.cell.styles.textColor = primaryColor;
            data.cell.styles.fontStyle = 'bold';
          } else if (text === '—') {
            data.cell.styles.textColor = [180, 180, 180];
          }
        }
      },
    });

    yPosition = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || yPosition + 30;
    yPosition += 10;
  });

  // Legend
  if (yPosition > 170) {
    doc.addPage('landscape');
    yPosition = 20;
  }

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const legendItems = [
    { symbol: '✓ Taken', color: successColor },
    { symbol: '✗ Missed', color: dangerColor },
    { symbol: '● Today', color: primaryColor },
    { symbol: '○ Scheduled', color: [100, 100, 100] as [number, number, number] },
  ];

  let legendX = 15;
  doc.text('Legend:', legendX, yPosition + 5);
  legendX += 25;

  legendItems.forEach((item) => {
    doc.setTextColor(...item.color);
    doc.text(item.symbol, legendX, yPosition + 5);
    legendX += 35;
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `MedTrack - Weekly Schedule | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  const dateStr = format(weekDays[0], 'yyyy-MM-dd');
  const filename = `medtrack-weekly-schedule-${dateStr}.pdf`;
  doc.save(filename);

  return filename;
}
