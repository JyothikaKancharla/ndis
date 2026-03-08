const { analyzeNoteContent, generateIncidentReport, hasIncidentReport } = require('../utils/noteAnalyzer');
const Note = require('../models/Note');
const PDFDocument = require('pdfkit');

/**
 * Analyze a note for risks and sentiment
 * POST /api/notes/:noteId/analyze
 */
exports.analyzeNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    const note = await Note.findById(noteId)
      .populate('staffId', 'name email')
      .populate('clientId', 'name ndisNumber');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    console.log(`🔍 Analyzing note ${noteId} for client ${note.clientId?.name}`);

    // Analyze note content
    const analysis = analyzeNoteContent(note.content);

    console.log(`📊 Analysis complete: Sentiment=${analysis.sentiment}, Risk=${analysis.risk_detected}, Keywords=${analysis.keywords_found.length}`);

    // Generate incident report if needed
    let incidentReport = null;
    if (analysis.incident_report_required) {
      incidentReport = generateIncidentReport(
        note.content,
        analysis.keywords_found,
        analysis.matched_categories
      );
    }

    // Check if formal incident report already exists
    const incidentExists = hasIncidentReport(note);

    // Reminder message
    let reminderMessage = '';
    if (analysis.incident_report_required && !incidentExists) {
      reminderMessage = 'This note appears to contain an incident. Please complete an incident report before locking the notes.';
    }

    const result = {
      risk_detected: analysis.risk_detected,
      keywords_found: analysis.keywords_found,
      sentiment: analysis.sentiment,
      sentiment_reason: analysis.sentiment_reason,
      incident_report: {
        required: analysis.incident_report_required,
        ...(incidentReport || {})
      },
      reminder_message: reminderMessage,
      metadata: {
        note_id: note._id,
        client_name: note.clientId?.name,
        staff_name: note.staffId?.name,
        shift_date: note.shiftDate,
        shift: note.shift,
        analyzed_at: new Date()
      }
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Note analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze note',
      error: error.message
    });
  }
};

/**
 * Download analysis report as PDF
 * GET /api/notes/:noteId/analysis-report
 */
exports.downloadAnalysisReport = async (req, res) => {
  try {
    const { noteId } = req.params;

    const note = await Note.findById(noteId)
      .populate('staffId', 'name email')
      .populate('clientId', 'name ndisNumber careLevel');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Analyze note
    const analysis = analyzeNoteContent(note.content);
    let incidentReport = null;
    if (analysis.incident_report_required) {
      incidentReport = generateIncidentReport(
        note.content,
        analysis.keywords_found,
        analysis.matched_categories
      );
    }

    // Generate PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const filename = `clinical-analysis-${note.clientId?.name?.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    });
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    });

    // PDF Header
    doc.fontSize(22).fillColor('#7e3285').text('Clinical Documentation Analysis', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#999999').text('NexCare NDIS Management System', { align: 'center' });
    doc.moveDown(1.5);

    // Note Information Box
    const boxTop = doc.y;
    doc.rect(50, boxTop, doc.page.width - 100, 100).fillAndStroke('#f8f4f9', '#7e3285');

    doc.fontSize(12).fillColor('#333333').text(`Client: ${note.clientId?.name || 'Unknown'}`, 70, boxTop + 15);
    doc.text(`Staff: ${note.staffId?.name || 'Unknown'}`, 70, boxTop + 35);
    doc.text(`Shift Date: ${new Date(note.shiftDate).toLocaleDateString()}`, 70, boxTop + 55);
    doc.text(`Shift: ${note.shift}`, 320, boxTop + 55);
    doc.text(`Analyzed: ${new Date().toLocaleString()}`, 70, boxTop + 75);

    doc.moveDown(3);

    // Risk Assessment Section
    doc.fontSize(16).fillColor('#7e3285').text('Risk Assessment', { underline: true });
    doc.moveDown(0.5);

    const riskColor = analysis.risk_detected ? '#ef4444' : '#22c55e';
    doc.fontSize(12).fillColor('#333333');
    doc.text(`Risk Detected: `, { continued: true });
    doc.fillColor(riskColor).text(analysis.risk_detected ? 'YES' : 'NO');

    doc.fillColor('#333333').text(`Sentiment: `, { continued: true });
    const sentimentColors = {
      'High Risk': '#ef4444',
      'Concerning': '#f59e0b',
      'Positive': '#22c55e',
      'Neutral': '#6b7280'
    };
    doc.fillColor(sentimentColors[analysis.sentiment] || '#6b7280').text(analysis.sentiment);

    doc.fillColor('#666666').fontSize(11).text(`Reason: ${analysis.sentiment_reason}`, { width: 500 });
    doc.moveDown();

    // Keywords Detected
    if (analysis.keywords_found && analysis.keywords_found.length > 0) {
      doc.fontSize(14).fillColor('#7e3285').text('Keywords Detected', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#666666');
      doc.text(analysis.keywords_found.join(', '), { width: 500 });
      doc.moveDown();
    }

    // Incident Report Section
    if (incidentReport) {
      doc.addPage();
      doc.fontSize(18).fillColor('#ef4444').text('⚠ Incident Report Required', { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(12).fillColor('#333333');
      doc.text(`Incident Type: `, { continued: true });
      doc.fillColor('#ef4444').text(incidentReport.incident_type);

      doc.moveDown(0.5);
      doc.fillColor('#333333').text('What Happened:', { underline: true });
      doc.fontSize(11).fillColor('#666666').text(incidentReport.what_happened, { width: 500 });

      doc.moveDown(0.5);
      doc.fillColor('#333333').fontSize(12).text('Possible Cause:', { underline: true });
      doc.fontSize(11).fillColor('#666666').text(incidentReport.why, { width: 500 });

      doc.moveDown(0.5);
      doc.fillColor('#333333').fontSize(12).text('Action Taken:', { underline: true });
      doc.fontSize(11).fillColor('#666666').text(incidentReport.action_taken, { width: 500 });

      doc.moveDown(0.5);
      doc.fillColor('#333333').fontSize(12).text('How Controlled:', { underline: true });
      doc.fontSize(11).fillColor('#666666').text(incidentReport.controlled_how, { width: 500 });

      doc.moveDown(0.5);
      doc.fillColor('#333333').fontSize(12).text('Recommended Follow-up:', { underline: true });
      doc.fontSize(11).fillColor('#666666').text(incidentReport.follow_up, { width: 500 });

      doc.moveDown();
    }

    // Full Note Content
    doc.addPage();
    doc.fontSize(16).fillColor('#7e3285').text('Full Note Content', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333333').text(note.content, { width: 500, lineGap: 4 });

    // Footer on all pages
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#999999').text(
        `Clinical Analysis Report - Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 }
      );
    }

    doc.end();
  } catch (error) {
    console.error('Report generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate analysis report',
        error: error.message
      });
    }
  }
};
