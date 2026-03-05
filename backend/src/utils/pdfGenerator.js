const PDFDocument = require('pdfkit');
const Assignment = require('../models/Assignment');
const Client = require('../models/Client');

/**
 * Generate PDF summary of client shifts
 * @param {String} clientId - Client MongoDB ID
 * @param {String} period - 'weekly' | 'monthly' | 'custom'
 * @param {Date} startDate - Start date for custom range (optional)
 * @param {Date} endDate - End date for custom range (optional)
 * @returns {Promise<Buffer>} PDF buffer
 */
exports.generateClientShiftReport = async (clientId, period, startDate = null, endDate = null) => {
  // Calculate date range based on period
  let dateFilter = {};
  const now = new Date();

  if (period === 'weekly') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = { completedAt: { $gte: weekAgo, $lte: now } };
  } else if (period === 'monthly') {
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    dateFilter = { completedAt: { $gte: monthAgo, $lte: now } };
  } else if (period === 'custom' && startDate && endDate) {
    dateFilter = { completedAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
  }

  // Fetch client details
  const client = await Client.findById(clientId);
  if (!client) {
    throw new Error('Client not found');
  }

  // Fetch completed shifts for this client
  const shifts = await Assignment.find({
    clientId,
    status: 'Previous',
    ...dateFilter
  })
    .populate('staffId', 'name email phone')
    .sort({ completedAt: -1 });

  // Generate PDF
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });

    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header Section
    doc.fontSize(22)
       .fillColor('#7e3285')
       .text('Client Shift Summary Report', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(10)
       .fillColor('#666666')
       .text('NexCare NDIS Management System', { align: 'center' });

    doc.moveDown(1.5);

    // Client Information Box
    const boxTop = doc.y;
    doc.rect(50, boxTop, doc.page.width - 100, 120)
       .fillAndStroke('#f8f4f9', '#7e3285');

    doc.fontSize(14)
       .fillColor('#333333')
       .text(`Client: ${client.name}`, 70, boxTop + 20);

    doc.fontSize(11)
       .fillColor('#666666')
       .text(`NDIS Number: ${client.ndisNumber || 'N/A'}`, 70, boxTop + 45);

    doc.text(`Care Level: ${client.careLevel}`, 70, boxTop + 65);

    // Report details on the right
    const periodText = period.charAt(0).toUpperCase() + period.slice(1);
    doc.text(`Report Period: ${periodText}`, 320, boxTop + 45);
    doc.text(`Generated: ${now.toLocaleDateString()}`, 320, boxTop + 65);

    doc.moveDown(3);

    // Summary Statistics
    doc.fontSize(14)
       .fillColor('#7e3285')
       .text('Shift Summary', { underline: true });

    doc.moveDown(0.5);

    const uniqueStaff = [...new Set(shifts.map(s => s.staffId?._id?.toString()).filter(Boolean))];

    doc.fontSize(11)
       .fillColor('#333333')
       .text(`Total Shifts Completed: ${shifts.length}`);
    doc.text(`Staff Members Involved: ${uniqueStaff.length}`);

    if (dateFilter.completedAt) {
      const startDateStr = dateFilter.completedAt.$gte
        ? new Date(dateFilter.completedAt.$gte).toLocaleDateString()
        : 'N/A';
      const endDateStr = dateFilter.completedAt.$lte
        ? new Date(dateFilter.completedAt.$lte).toLocaleDateString()
        : 'N/A';
      doc.text(`Date Range: ${startDateStr} - ${endDateStr}`);
    }

    doc.moveDown(1.5);

    // Shifts Table
    doc.fontSize(14)
       .fillColor('#7e3285')
       .text('Completed Shifts', { underline: true });

    doc.moveDown(0.5);

    if (shifts.length === 0) {
      doc.fontSize(11)
         .fillColor('#999999')
         .text('No completed shifts found for this period.', { align: 'center' });
    } else {
      // Table Header
      const tableTop = doc.y;
      const colWidths = { date: 90, shift: 110, staff: 140, status: 80 };
      const startX = 50;

      // Header background
      doc.rect(startX, tableTop - 5, doc.page.width - 100, 20)
         .fillAndStroke('#7e3285', '#7e3285');

      doc.fontSize(10)
         .fillColor('#ffffff')
         .text('Date', startX + 5, tableTop, { width: colWidths.date, continued: false });
      doc.text('Shift Time', startX + colWidths.date + 5, tableTop, { width: colWidths.shift, continued: false });
      doc.text('Staff Member', startX + colWidths.date + colWidths.shift + 5, tableTop, { width: colWidths.staff, continued: false });
      doc.text('Status', startX + colWidths.date + colWidths.shift + colWidths.staff + 5, tableTop, { width: colWidths.status });

      let yPosition = tableTop + 25;

      // Table rows
      shifts.forEach((shift, index) => {
        // Check if we need a new page
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        const dateStr = shift.completedAt
          ? new Date(shift.completedAt).toLocaleDateString()
          : new Date(shift.startDate).toLocaleDateString();
        const staffName = shift.staffId?.name || 'Unknown Staff';

        // Alternating row colors
        if (index % 2 === 0) {
          doc.rect(startX, yPosition - 5, doc.page.width - 100, 22)
             .fillAndStroke('#f8f4f9', '#ffffff');
        }

        doc.fontSize(9)
           .fillColor('#333333')
           .text(dateStr, startX + 5, yPosition, { width: colWidths.date });
        doc.text(shift.shift || 'N/A', startX + colWidths.date + 5, yPosition, { width: colWidths.shift });
        doc.text(staffName, startX + colWidths.date + colWidths.shift + 5, yPosition, { width: colWidths.staff });
        doc.text('Completed', startX + colWidths.date + colWidths.shift + colWidths.staff + 5, yPosition, { width: colWidths.status });

        yPosition += 22;

        // Add notes if available
        if (shift.shiftNotes && shift.shiftNotes.trim()) {
          doc.fontSize(8)
             .fillColor('#666666')
             .text(`Notes: ${shift.shiftNotes.substring(0, 150)}${shift.shiftNotes.length > 150 ? '...' : ''}`,
                    startX + 5,
                    yPosition,
                    { width: doc.page.width - 110 });
          yPosition += 18;
        }

        // Divider line
        if (index < shifts.length - 1) {
          doc.moveTo(startX, yPosition)
             .lineTo(doc.page.width - 50, yPosition)
             .stroke('#e0e0e0');
          yPosition += 5;
        }
      });
    }

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .fillColor('#999999')
         .text(
           `Report generated by NexCare NDIS Management System - Page ${i + 1} of ${pageCount}`,
           50,
           doc.page.height - 50,
           { align: 'center', width: doc.page.width - 100 }
         );
    }

    doc.end();
  });
};

/**
 * Calculate age from date of birth
 * @param {Date} dob - Date of birth
 * @returns {Number} Age in years
 */
function calculateAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
