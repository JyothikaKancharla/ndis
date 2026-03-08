const Client = require('../models/Client');
const Assignment = require('../models/Assignment');
const Note = require('../models/Note');
const { generateClientShiftReport } = require('../utils/pdfGenerator');
const { extractKeyPoints } = require('../utils/noteAnalyzer');
const PDFDocument = require('pdfkit');

/**
 * GET /api/clients/:clientId
 * Get detailed client information with populated assignments and notes
 */
exports.getClientDetails = async (req, res) => {
  try {
    const { clientId } = req.params;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Get active assignments for this client
    const activeAssignments = await Assignment.find({
      clientId,
      status: { $in: ['Current', 'Pending'] },
      isActive: true
    })
      .populate('staffId', 'name email phone')
      .sort({ startDate: -1 });

    // Get completed shifts count
    const completedShiftsCount = await Assignment.countDocuments({
      clientId,
      status: 'Previous'
    });

    // Get recent notes count
    const notesCount = await Note.countDocuments({
      clientId,
      status: 'Approved'
    });

    res.json({
      success: true,
      data: {
        client,
        activeAssignments,
        completedShiftsCount,
        notesCount
      }
    });
  } catch (error) {
    console.error('Get client details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client details',
      error: error.message
    });
  }
};

/**
 * GET /api/clients/:clientId/shifts
 * Get shift history for a specific client
 */
exports.getClientShifts = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { dateRange, status } = req.query;

    const filter = { clientId };

    if (status) {
      filter.status = status;
    } else {
      filter.status = 'Previous'; // Default to completed shifts
    }

    // Date range filtering
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const date = now.getUTCDate();

      filter.completedAt = {};
      if (dateRange === 'week') {
        filter.completedAt.$gte = new Date(Date.UTC(year, month, date - 7));
      } else if (dateRange === 'month') {
        filter.completedAt.$gte = new Date(Date.UTC(year, month, date - 30));
      } else if (dateRange === '3months') {
        filter.completedAt.$gte = new Date(Date.UTC(year, month, date - 90));
      }
    }

    const shifts = await Assignment.find(filter)
      .populate('staffId', 'name email phone')
      .populate('lockedBy', 'name')
      .sort({ completedAt: -1, startDate: -1 })
      .limit(100); // Limit to recent 100 shifts

    res.json({
      success: true,
      data: shifts,
      total: shifts.length
    });
  } catch (error) {
    console.error('Get client shifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client shifts',
      error: error.message
    });
  }
};

/**
 * GET /api/clients/:clientId/notes
 * Get notes history for a specific client
 */
exports.getClientNotes = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { staffId, category, dateRange } = req.query;

    const filter = {
      clientId,
      status: 'Approved' // Only show approved notes
    };

    if (staffId && staffId !== 'all') {
      filter.staffId = staffId;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    // Date range filtering
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const date = now.getUTCDate();

      filter.shiftDate = {};
      if (dateRange === 'week') {
        filter.shiftDate.$gte = new Date(Date.UTC(year, month, date - 7));
      } else if (dateRange === 'month') {
        filter.shiftDate.$gte = new Date(Date.UTC(year, month, date - 30));
      } else if (dateRange === '3months') {
        filter.shiftDate.$gte = new Date(Date.UTC(year, month, date - 90));
      }
    }

    const notes = await Note.find(filter)
      .populate('staffId', 'name email')
      .populate('verifiedBy', 'name')
      .sort({ shiftDate: -1, createdAt: -1 })
      .limit(100); // Limit to recent 100 notes

    res.json({
      success: true,
      data: notes,
      total: notes.length
    });
  } catch (error) {
    console.error('Get client notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client notes',
      error: error.message
    });
  }
};

/**
 * GET /api/clients/:clientId/report
 * Download PDF report for client shifts
 * Query params: period (weekly|monthly|custom), startDate, endDate
 */
exports.downloadClientReport = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { period = 'monthly', startDate, endDate } = req.query;

    // Validate period
    if (!['weekly', 'monthly', 'custom'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period. Must be weekly, monthly, or custom'
      });
    }

    // For custom period, validate dates
    if (period === 'custom') {
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required for custom period'
        });
      }
    }

    // Generate PDF
    const pdfBuffer = await generateClientShiftReport(clientId, period, startDate, endDate);

    // Get client name for filename
    const client = await Client.findById(clientId);
    const clientName = client ? client.name.replace(/\s+/g, '-') : 'client';
    const filename = `${clientName}-${period}-report-${new Date().toISOString().split('T')[0]}.pdf`;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

/**
 * Download client summary report (key points only, not full notes)
 * GET /api/clients/:clientId/summary-report
 */
exports.downloadClientSummary = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { period = 'month' } = req.query;

    // Fetch client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Fetch notes
    const notesRes = await Note.find({
      clientId,
      status: 'Approved'
    })
      .populate('staffId', 'name')
      .sort({ shiftDate: -1 })
      .limit(100);

    // Fetch shifts
    const shiftsRes = await Assignment.find({
      clientId,
      status: 'Previous'
    })
      .populate('staffId', 'name')
      .sort({ completedAt: -1 })
      .limit(50);

    // Extract key points
    const summary = extractKeyPoints(notesRes);

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const filename = `${client.name.replace(/\s+/g, '-')}-Summary-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    });

    // Header
    doc.fontSize(22).fillColor('#7e3285').text('Client Summary Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#999999').text('Key Points Extract - NexCare NDIS', { align: 'center' });
    doc.moveDown(1.5);

    // Client Info
    const boxTop = doc.y;
    doc.rect(50, boxTop, doc.page.width - 100, 90).fillAndStroke('#f8f4f9', '#7e3285');
    doc.fontSize(14).fillColor('#333333').text(`Client: ${client.name}`, 70, boxTop + 15);
    doc.fontSize(11).fillColor('#666666');
    doc.text(`NDIS Number: ${client.ndisNumber || 'N/A'}`, 70, boxTop + 38);
    doc.text(`Care Level: ${client.careLevel}`, 70, boxTop + 55);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 320, boxTop + 38);
    if (summary.date_range.earliest) {
      doc.text(`Period: ${summary.date_range.earliest.toLocaleDateString()} - ${summary.date_range.latest.toLocaleDateString()}`, 320, boxTop + 55);
    }
    doc.moveDown(3);

    // Summary Stats
    doc.fontSize(14).fillColor('#7e3285').text('Overview', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333333');
    doc.text(`Total Shifts: ${shiftsRes.length}`);
    doc.text(`Total Notes Analyzed: ${summary.total_notes}`);
    doc.text(`Staff Members Involved: ${summary.staff_involved.join(', ')}`);
    doc.moveDown();

    // Incidents
    if (summary.incidents.length > 0) {
      doc.addPage();
      doc.fontSize(16).fillColor('#ef4444').text('⚠ Key Incidents', { underline: true });
      doc.moveDown(0.5);
      summary.incidents.forEach((incident, i) => {
        doc.fontSize(11).fillColor('#333333').text(`${i + 1}. ${incident.date}`, { continued: true });
        doc.fillColor('#ef4444').text(` [${incident.severity}]`);
        doc.fontSize(10).fillColor('#666666').text(incident.description, { width: 500, indent: 10 });
        doc.fontSize(9).fillColor('#999999').text(`Keywords: ${incident.keywords.join(', ')}`, { indent: 10 });
        doc.moveDown(0.5);
      });
      doc.moveDown();
    }

    // Health Concerns
    if (summary.health_concerns.length > 0) {
      doc.fontSize(16).fillColor('#f59e0b').text('🏥 Health Concerns', { underline: true });
      doc.moveDown(0.5);
      summary.health_concerns.forEach((concern, i) => {
        doc.fontSize(11).fillColor('#333333').text(`${i + 1}. ${concern.date}`);
        doc.fontSize(10).fillColor('#666666').text(concern.description, { width: 500, indent: 10 });
        doc.moveDown(0.5);
      });
      doc.moveDown();
    }

    // Behavioral Observations
    if (summary.behavioral_observations.length > 0) {
      doc.fontSize(16).fillColor('#f59e0b').text('👤 Behavioral Observations', { underline: true });
      doc.moveDown(0.5);
      summary.behavioral_observations.forEach((obs, i) => {
        doc.fontSize(11).fillColor('#333333').text(`${i + 1}. ${obs.date}`);
        doc.fontSize(10).fillColor('#666666').text(obs.description, { width: 500, indent: 10 });
        doc.moveDown(0.5);
      });
      doc.moveDown();
    }

    // Medication Issues
    if (summary.medication_issues.length > 0) {
      if (doc.y > 650) doc.addPage();
      doc.fontSize(16).fillColor('#3b82f6').text('💊 Medication Notes', { underline: true });
      doc.moveDown(0.5);
      summary.medication_issues.forEach((med, i) => {
        doc.fontSize(11).fillColor('#333333').text(`${i + 1}. ${med.date}`);
        doc.fontSize(10).fillColor('#666666').text(med.description, { width: 500, indent: 10 });
        doc.moveDown(0.5);
      });
      doc.moveDown();
    }

    // Positive Progress
    if (summary.positive_progress.length > 0) {
      if (doc.y > 650) doc.addPage();
      doc.fontSize(16).fillColor('#22c55e').text('✅ Positive Progress', { underline: true });
      doc.moveDown(0.5);
      summary.positive_progress.forEach((progress, i) => {
        doc.fontSize(11).fillColor('#333333').text(`${i + 1}. ${progress.date}`);
        doc.fontSize(10).fillColor('#666666').text(progress.description, { width: 500, indent: 10 });
        doc.moveDown(0.5);
      });
    }

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#999999').text(
        `Client Summary Report - Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 }
      );
    }

    doc.end();
  } catch (error) {
    console.error('Summary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate summary report',
      error: error.message
    });
  }
};
