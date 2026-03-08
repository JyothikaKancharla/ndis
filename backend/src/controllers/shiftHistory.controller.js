const Assignment = require('../models/Assignment');
const Note = require('../models/Note');

// GET /api/shift-history
exports.getShiftHistory = async (req, res) => {
  try {
    const { staffFilter, clientFilter, dateRange } = req.query;
    const filter = { status: 'Previous' };

    // Staff can only see their own completed shifts
    if (req.user.role === 'staff') {
      filter.staffId = req.user._id;
    } else if (staffFilter && staffFilter !== 'all') {
      filter.staffId = staffFilter;
    }

    if (clientFilter && clientFilter !== 'all') {
      filter.clientId = clientFilter;
    }

    // Date range filtering
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const date = now.getUTCDate();
      const startOfDay = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month, date + 1, 0, 0, 0, 0));

      filter.startDate = {};
      if (dateRange === 'today') {
        filter.startDate.$gte = startOfDay;
        filter.startDate.$lt = endOfDay;
      } else if (dateRange === 'week') {
        filter.startDate.$gte = new Date(Date.UTC(year, month, date - 7));
        filter.startDate.$lt = endOfDay;
      } else if (dateRange === 'month') {
        filter.startDate.$gte = new Date(Date.UTC(year, month - 1, date));
        filter.startDate.$lt = endOfDay;
      } else if (dateRange === 'year') {
        filter.startDate.$gte = new Date(Date.UTC(year - 1, month, date));
        filter.startDate.$lt = endOfDay;
      }
    }

    const assignments = await Assignment.find(filter)
      .populate('staffId', 'name email phone')
      .populate('clientId', 'name room careLevel address')
      .populate('lockedBy', 'name')
      .populate('unlockedBy', 'name')
      .sort({ startDate: -1 });

    // Fetch notes for the same staff+client combinations
    const clientIds = [...new Set(assignments.map(a => a.clientId?._id?.toString()).filter(Boolean))];

    const noteFilter = { clientId: { $in: clientIds } };
    if (req.user.role === 'staff') {
      noteFilter.staffId = req.user._id;
    }

    const notes = clientIds.length > 0
      ? await Note.find(noteFilter)
          .select('clientId staffId shift shiftDate status isLocked content entries category createdAt')
          .sort({ shiftDate: -1, createdAt: -1 })
      : [];

    // Group notes by clientId
    const notesByClient = {};
    notes.forEach(note => {
      const key = note.clientId.toString();
      if (!notesByClient[key]) notesByClient[key] = [];
      notesByClient[key].push(note);
    });

    // Attach notes to each assignment
    const data = assignments.map(a => {
      const obj = a.toObject();
      obj.isLocked = obj.isLocked !== false;
      const clientKey = (obj.clientId?._id || obj.clientId)?.toString();
      obj.clientNotes = notesByClient[clientKey] || [];
      return obj;
    });

    res.json({
      success: true,
      data,
      total: data.length
    });
  } catch (error) {
    console.error('Error fetching shift history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift history',
      error: error.message
    });
  }
};

// PUT /api/shift-history/:id/unlock
exports.unlockShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Unlock reason is required'
      });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.isLocked === false) {
      return res.status(400).json({
        success: false,
        message: 'This shift record is already unlocked'
      });
    }

    assignment.isLocked = false;
    assignment.unlockedBy = req.user._id;
    assignment.unlockedAt = new Date();
    await assignment.save();

    const populated = await Assignment.findById(id)
      .populate('staffId', 'name email phone')
      .populate('clientId', 'name room careLevel address')
      .populate('lockedBy', 'name')
      .populate('unlockedBy', 'name');

    res.json({
      success: true,
      message: 'Shift record unlocked successfully',
      data: populated
    });
  } catch (error) {
    console.error('Error unlocking shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock shift record',
      error: error.message
    });
  }
};

// PUT /api/shift-history/:id/lock
exports.lockShift = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'This shift record is already locked'
      });
    }

    assignment.isLocked = true;
    assignment.lockedAt = new Date();
    assignment.lockedBy = req.user._id;
    await assignment.save();

    const populated = await Assignment.findById(id)
      .populate('staffId', 'name email phone')
      .populate('clientId', 'name room careLevel address')
      .populate('lockedBy', 'name')
      .populate('unlockedBy', 'name');

    res.json({
      success: true,
      message: 'Shift record locked successfully',
      data: populated
    });
  } catch (error) {
    console.error('Error locking shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lock shift record',
      error: error.message
    });
  }
};

// PUT /api/shift-history/:id/notes
exports.updateShiftNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { shiftNotes } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignment.isLocked !== false) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit a locked shift record. Unlock it first.'
      });
    }

    assignment.shiftNotes = shiftNotes || '';
    await assignment.save();

    const populated = await Assignment.findById(id)
      .populate('staffId', 'name email phone')
      .populate('clientId', 'name room careLevel address')
      .populate('lockedBy', 'name')
      .populate('unlockedBy', 'name');

    res.json({
      success: true,
      message: 'Shift notes updated successfully',
      data: populated
    });
  } catch (error) {
    console.error('Error updating shift notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shift notes',
      error: error.message
    });
  }
};

// DELETE /api/shift-history/:id
exports.deleteShift = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Shift record not found'
      });
    }

    // Staff can only delete their own shift records
    if (req.user.role === 'staff' && assignment.staffId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own shift records'
      });
    }

    // Delete associated notes for this staff+client
    await Note.deleteMany({
      staffId: assignment.staffId,
      clientId: assignment.clientId
    });

    await Assignment.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Shift record and associated notes deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shift record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shift record',
      error: error.message
    });
  }
};

/**
 * Download shift history as Excel
 * GET /api/shift-history/export?period=week|month|year|custom&startDate=...&endDate=...
 */
exports.exportShiftHistoryExcel = async (req, res) => {
  try {
    const { period = 'month', startDate, endDate, staffFilter, clientFilter } = req.query;
    const { generateShiftHistoryExcel, getDateFilter } = require('../utils/excelGenerator');

    console.log('Excel Export Request - Period:', period);
    console.log('User Role:', req.user.role);

    // Build filter
    const filter = { status: 'Previous' };

    // Staff can only export their own shifts
    if (req.user.role === 'staff') {
      filter.staffId = req.user._id;
    } else if (staffFilter && staffFilter !== 'all') {
      filter.staffId = staffFilter;
    }

    if (clientFilter && clientFilter !== 'all') {
      filter.clientId = clientFilter;
    }

    // Add date filter
    const dateFilter = getDateFilter(period, startDate, endDate);
    Object.assign(filter, dateFilter);

    console.log('Final Excel filter:', JSON.stringify(filter));

    // Generate Excel file
    const excelBuffer = await generateShiftHistoryExcel(filter, period);

    // Validate buffer
    if (!excelBuffer || excelBuffer.length === 0) {
      throw new Error('Generated Excel file is empty');
    }

    console.log(`Excel file generated successfully. Size: ${excelBuffer.length} bytes`);

    // Set response headers
    const filename = `Shift_Report_${period.charAt(0).toUpperCase() + period.slice(1)}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    res.send(excelBuffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Excel report',
      error: error.message
    });
  }
};
