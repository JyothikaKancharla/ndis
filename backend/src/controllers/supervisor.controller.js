const Note = require('../models/Note');
const Client = require('../models/Client');
const Assignment = require('../models/Assignment');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { calculateDynamicStatus } = require('../utils/assignmentStatus');

/**
 * Calculate assignment status based on date and shift time
 */
const calculateAssignmentStatus = (startDate, shift) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const assignDay = new Date(startDate);
  assignDay.setHours(0, 0, 0, 0);

  // Parse shift time
  const parseTimeString = (timeStr) => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return { hours: 0, minutes: 0 };
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return { hours, minutes };
  };

  const [startStr, endStr] = shift.split(' - ');
  const startTime = parseTimeString(startStr);
  const endTime = parseTimeString(endStr);

  let shiftStart = new Date(assignDay);
  shiftStart.setHours(startTime.hours, startTime.minutes, 0, 0);

  let shiftEnd = new Date(assignDay);
  shiftEnd.setHours(endTime.hours, endTime.minutes, 0, 0);

  // Handle overnight shifts
  if (shiftEnd < shiftStart) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  // Status logic
  if (assignDay.getTime() === today.getTime() && now >= shiftStart && now < shiftEnd) {
    return 'Current';
  }
  if (assignDay.getTime() > today.getTime() || (assignDay.getTime() === today.getTime() && now < shiftStart)) {
    return 'Pending';
  }
  return 'Previous';
};

/**
 * Calculate assignment end date (1 month from start date)
 */
const calculateAssignmentEndDate = (startDate) => {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  return endDate;
};

/**
 * Check if two shift time strings overlap
 * Handles overnight shifts (e.g., "10:00 PM - 6:00 AM")
 */
const shiftsOverlap = (shiftA, shiftB) => {
  const parseTime = (timeStr) => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };
  const parseShift = (shift) => {
    const [startStr, endStr] = shift.split(' - ');
    let start = parseTime(startStr);
    let end = parseTime(endStr);
    if (end <= start) end += 24 * 60;
    return { start, end };
  };
  const a = parseShift(shiftA);
  const b = parseShift(shiftB);
  return a.start < b.end && b.start < a.end;
};

/**
 * Get supervisor dashboard statistics with shift breakdown
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await Note.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          pendingNotes: [{ $match: { status: { $in: ['Pending', 'Submitted'] } } }, { $count: 'count' }],
          verifiedNotes: [{ $match: { status: 'Approved' } }, { $count: 'count' }],
          byShift: [
            { 
              $group: { 
                _id: '$shift', 
                count: { $sum: 1 } 
              } 
            }
          ]
        }
      }
    ]);
    
    // Get staff and client counts
    const staffCount = await User.countDocuments({ role: 'staff', isActive: true });
    const clientCount = await Client.countDocuments({ isActive: true });
    
    // Format shift breakdown
    const notesByShift = {};
    stats[0].byShift.forEach(item => {
      notesByShift[item._id] = item.count;
    });
    
    res.json({
      success: true,
      data: {
        totalNotes: stats[0].total[0]?.count || 0,
        pendingNotes: stats[0].pendingNotes[0]?.count || 0,
        verifiedNotes: stats[0].verifiedNotes[0]?.count || 0,
        totalStaff: staffCount,
        totalClients: clientCount,
        notesByShift
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

/**
 * Get notes with filters (status, client, staff, shift, date range, locked)
 */
exports.getNotes = async (req, res) => {
  try {
    const { status, client, staff, shift, dateRange, fromDate, toDate, locked } = req.query;
    
    console.log('🔍 getNotes called with query params:', req.query);
    console.log('Parsed filters:', { status, client, staff, shift, dateRange, fromDate, toDate, locked });
    
    const filter = {};

    // Handle status filter - convert to proper case
    if (status === 'all') {
      // Explicitly requesting all statuses - no status filter applied
      console.log('Applied filter: all statuses (no restriction)');
    } else if (status) {
      // Convert lowercase input to proper case for database comparison
      const statusMap = {
        'pending': 'Pending',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'draft': 'Draft',
        'consolidated': 'Consolidated',
        'submitted': 'Submitted'
      };
      const properStatus = statusMap[status.toLowerCase()] || status;
      filter.status = properStatus;
      console.log('Applied status filter:', properStatus);
    } else {
      // Default (no status param): only show Approved/locked notes
      filter.status = 'Approved';
      filter.isLocked = true;
      console.log('Applied default filter: Approved and locked notes only');
    }
    
    if (client && client !== 'all') {
      filter.clientId = client;
      console.log('Applied client filter:', client);
    }
    
    if (staff && staff !== 'all') {
      filter.staffId = staff;
      console.log('Applied staff filter:', staff);
    }
    
    // Handle shift filter - map short names to full shift times
    if (shift && shift !== 'all') {
      const shiftMap = {
        'morning': ['6:00 AM - 2:00 PM', '7:00 AM - 3:00 PM'],
        'afternoon': ['2:00 PM - 10:00 PM', '3:00 PM - 11:00 PM'],
        'night': ['10:00 PM - 6:00 AM', '11:00 PM - 7:00 AM']
      };
      const possibleShifts = shiftMap[shift.toLowerCase()];
      if (possibleShifts) {
        filter.shift = { $in: possibleShifts };
        console.log('Applied shift filter:', { original: shift, mapped: filter.shift });
      } else {
        filter.shift = shift;
        console.log('Applied shift filter (exact):', shift);
      }
    } else {
      console.log('No shift filter applied (all shifts)');
    }
    
    if (locked === 'true') {
      filter.isLocked = true;
      console.log('Applied locked filter');
    }
    
    // Handle date range filter - only apply if not 'all' and no custom date range
    if (dateRange && dateRange !== 'all') {
      // Use UTC dates to avoid timezone issues
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const date = now.getUTCDate();
      
      // Create dates using UTC
      const startOfDay = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month, date + 1, 0, 0, 0, 0));
      
      filter.shiftDate = {};
      
      if (dateRange === 'today') {
        filter.shiftDate.$gte = startOfDay;
        filter.shiftDate.$lt = endOfDay;
        console.log('Applied today filter:', { gte: startOfDay, lt: endOfDay });
      } else if (dateRange === 'week') {
        const weekAgo = new Date(Date.UTC(year, month, date - 7, 0, 0, 0, 0));
        filter.shiftDate.$gte = weekAgo;
        filter.shiftDate.$lt = endOfDay;
        console.log('Applied week filter:', { gte: weekAgo, lt: endOfDay });
      } else if (dateRange === 'month') {
        const monthAgo = new Date(Date.UTC(year, month, date - 30, 0, 0, 0, 0));
        filter.shiftDate.$gte = monthAgo;
        filter.shiftDate.$lt = endOfDay;
        console.log('Applied month filter:', { gte: monthAgo, lt: endOfDay });
      }
    } else if (fromDate || toDate) {
      // Custom date range
      filter.shiftDate = {};
      if (fromDate) filter.shiftDate.$gte = new Date(fromDate);
      if (toDate) filter.shiftDate.$lte = new Date(toDate);
      console.log('Applied custom date filter:', filter.shiftDate);
    } else {
      console.log('No date filter applied (all time)');
    }
    
    console.log('📊 Final filter object:', JSON.stringify(filter, null, 2));
    
    const notes = await Note.find(filter)
      .populate('staffId', 'name email')
      .populate('clientId', 'name room careLevel')
      .sort({ shiftDate: -1, createdAt: -1 });
    
    console.log(`✅ Found ${notes.length} notes matching filter`);
    
    if (notes.length > 0) {
      console.log('📝 First note details:');
      const firstNote = notes[0];
      console.log('  - shift:', firstNote.shift);
      console.log('  - shiftDate:', firstNote.shiftDate);
      console.log('  - status:', firstNote.status);
      console.log('  - staffId:', firstNote.staffId);
      console.log('  - clientId:', firstNote.clientId);
    }
    
    res.json({ 
      success: true, 
      data: notes 
    });
  } catch (error) {
    console.error('❌ Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message
    });
  }
};

/**
 * Get a single note by ID
 */
exports.getNoteById = async (req, res) => {
  try {
    const { noteId } = req.params;
    const note = await Note.findById(noteId)
      .populate('staffId', 'name email')
      .populate('clientId', 'name room careLevel');

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, data: note });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch note', error: error.message });
  }
};

/**
 * Verify note - approve or reject
 */
exports.verifyNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { status, rejectionReason, odometerStatus } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "Approved" or "Rejected"'
      });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    note.status = status;
    note.verifiedBy = req.user.id;
    note.verifiedAt = new Date();

    if (status === 'Rejected' && rejectionReason) {
      note.rejectionReason = rejectionReason;
    }

    if (status === 'Approved') {
      note.isLocked = true;
      note.lockedAt = new Date();
      note.lockedBy = req.user.id;
    }

    // Handle odometer status if note has odometer data
    if (note.startOdometer !== null && note.endOdometer !== null) {
      if (odometerStatus && ['approved', 'flagged'].includes(odometerStatus)) {
        note.odometerStatus = odometerStatus;
      } else if (status === 'Approved') {
        note.odometerStatus = 'approved';
      }
    }

    await note.save();
    
    res.json({
      success: true,
      message: `Note ${status === 'Approved' ? 'approved' : 'rejected'} successfully`,
      data: note
    });
  } catch (error) {
    console.error('Error verifying note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify note',
      error: error.message
    });
  }
};

/**
 * Unlock a locked note
 */
exports.unlockNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Unlock reason is required'
      });
    }
    
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    if (!note.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Note is not locked'
      });
    }
    
    note.isLocked = false;
    note.unlockedBy = req.user.id;
    note.unlockedAt = new Date();
    note.unlockReason = reason;
    note.status = 'Review'; // Return to review for staff to edit

    // Track unlock in edit history
    if (!note.editHistory) note.editHistory = [];
    note.editHistory.push({
      editedAt: new Date(),
      editedBy: req.user.id,
      reason: `Unlocked by supervisor: ${reason}`
    });

    await note.save();
    
    res.json({
      success: true,
      message: 'Note unlocked successfully',
      data: note
    });
  } catch (error) {
    console.error('Error unlocking note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock note',
      error: error.message
    });
  }
};

/**
 * Delete a note (supervisor only)
 */
exports.deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    await Note.findByIdAndDelete(noteId);

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error.message
    });
  }
};

/**
 * Get all assignments with filters
 */
exports.getAssignments = async (req, res) => {
  try {
    const { shift, active } = req.query;
    
    const filter = {};
    if (shift) {
      // Map short shift names to full shift times
      const shiftMap = {
        'morning': '6:00 AM - 2:00 PM',
        'afternoon': '2:00 PM - 10:00 PM',
        'night': '10:00 PM - 6:00 AM'
      };
      filter.shift = shiftMap[shift.toLowerCase()] || shift;
    }
    if (active !== 'false') filter.isActive = true;
    
    const assignments = await Assignment.find(filter)
      .populate('staffId', 'name email phone')
      .populate('clientId', 'name room careLevel')
      .populate('createdBy', 'name')
      .sort({ startDate: -1 });
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error.message
    });
  }
};

/**
 * Create new assignment
 */
exports.createAssignment = async (req, res) => {
  try {
    let { staffId, clientId, shift, rateType, startDate, isRecurring, recurringDays } = req.body;

    // Validate required fields
    if (!staffId || !clientId || !shift || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: staffId, clientId, shift, startDate'
      });
    }

    // Map shift names to full shift time strings (must happen before conflict checks)
    const shiftMap = {
      'morning': '6:00 AM - 2:00 PM',
      'afternoon': '2:00 PM - 10:00 PM',
      'night': '10:00 PM - 6:00 AM'
    };

    const mappedShift = shiftMap[shift.toLowerCase()] || shift;

    // Ensure rateType is properly capitalized
    const capitalizedRateType = rateType
      ? rateType.charAt(0).toUpperCase() + rateType.slice(1).toLowerCase()
      : 'Standard';

    // BUSINESS RULE: Check if this staff member has a genuinely ongoing assignment with this client
    // Uses dynamic status calculation instead of stale stored status
    const existingAssignments = await Assignment.find({
      staffId,
      clientId,
      isActive: true
    });

    for (const existing of existingAssignments) {
      const dynamicStatus = calculateDynamicStatus(existing.startDate, existing.endDate, existing.shift);

      if (dynamicStatus.status === 'Current' || dynamicStatus.status === 'Pending') {
        // Truly ongoing - check if new assignment would conflict (same date + same shift)
        const newStart = new Date(startDate);
        const existingStart = new Date(existing.startDate);
        newStart.setHours(0, 0, 0, 0);
        existingStart.setHours(0, 0, 0, 0);

        if (newStart.getTime() === existingStart.getTime() && existing.shift === mappedShift) {
          return res.status(409).json({
            success: false,
            message: 'This staff member already has an ongoing assignment for this client on this date.',
            existingAssignment: existing._id
          });
        }
      } else if (existing.isActive) {
        // Shift completed - mark as inactive (preserves assignment history)
        existing.isActive = false;
        existing.status = 'Previous';
        await existing.save();
      }
    }

    // Check for overlapping shifts for this staff on the same date (any client)
    const sameDayAssignments = await Assignment.find({
      staffId,
      startDate: new Date(startDate),
      isActive: true
    });

    for (const existing of sameDayAssignments) {
      const dynamicStatus = calculateDynamicStatus(existing.startDate, existing.endDate, existing.shift);
      if (dynamicStatus.status === 'Current' || dynamicStatus.status === 'Pending') {
        if (shiftsOverlap(mappedShift, existing.shift)) {
          return res.status(409).json({
            success: false,
            message: `This staff member already has a shift (${existing.shift}) on this date that overlaps.`,
            existingAssignment: existing._id
          });
        }
      }
    }

    // Check for exact duplicate assignment (unique index guard)
    const duplicate = await Assignment.findOne({
      staffId,
      clientId,
      shift: mappedShift,
      startDate: new Date(startDate)
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Assignment already exists for this staff, client, and shift on this date'
      });
    }

    const assignment = new Assignment({
      staffId,
      clientId,
      shift: mappedShift,
      rateType: capitalizedRateType,
      startDate: new Date(startDate),
      endDate: calculateAssignmentEndDate(new Date(startDate)),
      status: calculateAssignmentStatus(new Date(startDate), mappedShift),
      isRecurring: isRecurring || false,
      recurringDays: recurringDays || [],
      createdBy: req.user.id
    });

    await assignment.save();
    await assignment.populate('staffId', 'name email phone');
    await assignment.populate('clientId', 'name room careLevel');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    console.error('❌ Error creating assignment:', error);
    console.error('Request body:', req.body);
    res.status(500).json({
      success: false,
      message: 'Failed to create assignment',
      error: error.message,
      details: error.toString()
    });
  }
};

/**
 * Update assignment
 */
exports.updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const updates = req.body;

    // First, fetch the existing assignment to check its status
    const existingAssignment = await Assignment.findById(assignmentId);

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if assignment is completed (cannot modify completed assignments)
    const status = calculateAssignmentStatus(existingAssignment.startDate, existingAssignment.shift);
    if (status === 'Previous' || status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify completed assignments. Create a new assignment instead using "Reassign Staff" or "New Shift" options.',
        error: 'ASSIGNMENT_COMPLETED'
      });
    }

    // If startDate is being updated and endDate is not explicitly set, calculate it
    if (updates.startDate && !updates.endDate) {
      updates.endDate = calculateAssignmentEndDate(new Date(updates.startDate));
    }

    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      updates,
      { new: true, runValidators: true }
    ).populate('staffId', 'name email phone')
     .populate('clientId', 'name room careLevel');

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment',
      error: error.message
    });
  }
};

/**
 * Delete assignment
 */
exports.deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await Assignment.findByIdAndDelete(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assignment',
      error: error.message
    });
  }
};

/**
 * Get all eligible clients for a staff member (not currently assigned to that staff)
 */
exports.getClients = async (req, res) => {
  try {
    const { staffId } = req.query;

    // Get all clients
    const allClients = await Client.find()
      .select('_id name room careLevel')
      .sort({ name: 1 });

    // If no staffId provided, return all clients
    if (!staffId) {
      return res.json({
        success: true,
        data: allClients,
        totalAvailable: allClients.length
      });
    }

    // Get all active assignments for this staff member
    const allAssignmentsForStaff = await Assignment.find({
      staffId,
      isActive: true
    });

    // Filter to genuinely ongoing assignments using dynamic status calculation
    const genuinelyAssignedClientIds = [];
    for (const assignment of allAssignmentsForStaff) {
      const dynamicStatus = calculateDynamicStatus(
        assignment.startDate, assignment.endDate, assignment.shift
      );
      if (dynamicStatus.status === 'Current' || dynamicStatus.status === 'Pending') {
        genuinelyAssignedClientIds.push(assignment.clientId.toString());
      } else if (assignment.isActive) {
        // Opportunistically clean up stale records
        assignment.isActive = false;
        assignment.status = 'Previous';
        await assignment.save();
      }
    }
    const assignedClientsForStaff = [...new Set(genuinelyAssignedClientIds)];

    // Filter out clients with genuinely ongoing assignments for this staff
    const eligibleClients = allClients.filter(
      client => !assignedClientsForStaff.includes(client._id.toString())
    );

    res.json({
      success: true,
      data: eligibleClients,
      totalAvailable: eligibleClients.length,
      totalClients: allClients.length,
      assignedToStaffCount: assignedClientsForStaff.length
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients',
      error: error.message
    });
  }
};

/**
 * Get all trips with filters
 */
exports.getTrips = async (req, res) => {
  try {
    const { status, fromDate, toDate } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (fromDate || toDate) {
      filter.tripDate = {};
      if (fromDate) filter.tripDate.$gte = new Date(fromDate);
      if (toDate) filter.tripDate.$lte = new Date(toDate);
    }
    
    const trips = await Trip.find(filter)
      .populate('staffId', 'name email')
      .populate('clientId', 'name')
      .populate('reviewedBy', 'name')
      .sort({ tripDate: -1 });
    
    res.json({
      success: true,
      data: trips
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips',
      error: error.message
    });
  }
};

/**
 * Verify/approve or reject trip
 */
exports.verifyTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { status, supervisorNotes, rejectionReason } = req.body;
    
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "Approved" or "Rejected"'
      });
    }
    
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    trip.status = status;
    trip.reviewedBy = req.user.id;
    trip.reviewedAt = new Date();
    
    if (supervisorNotes) trip.supervisorNotes = supervisorNotes;
    if (status === 'Rejected' && rejectionReason) {
      trip.rejectionReason = rejectionReason;
    }
    
    await trip.save();
    
    res.json({
      success: true,
      message: `Trip ${status === 'Approved' ? 'approved' : 'rejected'} successfully`,
      data: trip
    });
  } catch (error) {
    console.error('Error verifying trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify trip',
      error: error.message
    });
  }
};

/**
 * Get travel statistics
 */
exports.getTravelStats = async (req, res) => {
  try {
    const stats = await Trip.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          approved: [{ $match: { status: 'Approved' } }, { $count: 'count' }],
          pending: [{ $match: { status: 'Pending' } }, { $count: 'count' }],
          totalDistance: [{ $match: { status: 'Approved' } }, { $group: { _id: null, distance: { $sum: '$totalDistance' } } }],
          byPurpose: [{ $group: { _id: '$purpose', count: { $sum: 1 } } }]
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalTrips: stats[0].total[0]?.count || 0,
        approvedTrips: stats[0].approved[0]?.count || 0,
        pendingTrips: stats[0].pending[0]?.count || 0,
        totalDistance: stats[0].totalDistance[0]?.distance || 0,
        tripsByPurpose: stats[0].byPurpose
      }
    });
  } catch (error) {
    console.error('Error fetching travel stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch travel statistics',
      error: error.message
    });
  }
};
/**
 * Reject a note
 */
exports.rejectNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { rejectionReason } = req.body;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    note.status = 'Rejected';
    note.rejectionReason = rejectionReason;
    note.reviewedBy = req.user.id;
    note.reviewedAt = new Date();

    await note.save();

    res.json({
      success: true,
      message: 'Note rejected successfully',
      data: note
    });
  } catch (error) {
    console.error('Error rejecting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject note',
      error: error.message
    });
  }
};

/**
 * Reject a trip
 */
exports.rejectTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { rejectionReason } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    trip.status = 'Rejected';
    trip.rejectionReason = rejectionReason;
    trip.reviewedBy = req.user.id;
    trip.reviewedAt = new Date();

    await trip.save();

    res.json({
      success: true,
      message: 'Trip rejected successfully',
      data: trip
    });
  } catch (error) {
    console.error('Error rejecting trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject trip',
      error: error.message
    });
  }
};

/**
 * Get dashboard overview data (active shifts, pending actions, recent activity, staff availability)
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // 1. Today's Active Shifts
    const todayAssignments = await Assignment.find({
      isActive: true,
      startDate: { $lte: tomorrow }
    }).populate('staffId', 'name email')
      .populate('clientId', 'name careLevel')
      .sort({ shift: 1 });

    const activeShifts = todayAssignments
      .map(a => {
        const computed = calculateDynamicStatus(a.startDate, a.endDate, a.shift);
        return { ...a.toObject(), computedStatus: computed.status, statusBadge: computed.badge };
      })
      .filter(a => a.computedStatus === 'Current' || a.computedStatus === 'Pending');

    // 2. Pending Actions
    const pendingNotesCount = await Note.countDocuments({ status: 'Pending' });
    const draftNotesCount = await Note.countDocuments({ status: 'Draft' });

    const allClients = await Client.find({ isActive: true }).select('_id');
    const assignedClientIds = await Assignment.distinct('clientId', { isActive: true });
    const unassignedClientsCount = allClients.filter(
      c => !assignedClientIds.some(id => id.toString() === c._id.toString())
    ).length;

    const shiftsActiveCount = activeShifts.filter(a => a.computedStatus === 'Current').length;

    // 3. Recent Activity (last 7 days)
    const recentNotes = await Note.find({
      createdAt: { $gte: weekAgo }
    }).populate('staffId', 'name')
      .populate('clientId', 'name')
      .sort({ createdAt: -1 })
      .limit(15)
      .select('staffId clientId status noteType createdAt verifiedAt shift shiftDate');

    const activities = recentNotes.map(note => ({
      type: note.status === 'Approved' ? 'verification' :
            note.status === 'Pending' ? 'submission' :
            note.status === 'Rejected' ? 'rejection' : 'note',
      staffName: note.staffId?.name || 'Unknown',
      clientName: note.clientId?.name || 'Unknown',
      noteType: note.noteType,
      status: note.status,
      timestamp: note.verifiedAt || note.createdAt,
    }));

    // 4. Staff Availability
    const totalStaff = await User.countDocuments({ role: 'staff', isActive: true });
    const staffOnShiftIds = [...new Set(
      activeShifts
        .filter(a => a.computedStatus === 'Current')
        .map(a => a.staffId?._id?.toString())
    )];
    const staffOnShift = staffOnShiftIds.length;
    const staffAvailable = totalStaff - staffOnShift;

    res.json({
      success: true,
      data: {
        activeShifts: activeShifts.slice(0, 10),
        pendingActions: {
          pendingNotes: pendingNotesCount,
          draftNotes: draftNotesCount,
          unassignedClients: unassignedClientsCount,
          shiftsActive: shiftsActiveCount,
        },
        recentActivity: activities,
        staffAvailability: {
          total: totalStaff,
          onShift: staffOnShift,
          available: staffAvailable,
        }
      }
    });
  } catch (err) {
    console.error('Dashboard overview error:', err);
    res.status(500).json({ success: false, message: 'Failed to load overview' });
  }
};

/**
 * Get all staff members (for supervisor to see available staff)
 */
exports.getStaff = async (req, res) => {
  try {
    const User = require('../models/User');
    // Include both staff and supervisors so supervisors can assign clients to themselves
    const staff = await User.find({ role: { $in: ['staff', 'supervisor'] } }).select('_id name email role');

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff',
      error: error.message
    });
  }
};
/**
 * APPOINTMENT MANAGEMENT
 */

/**
 * Create a new appointment
 */
exports.createAppointment = async (req, res) => {
  try {
    const { clientId, staffId, title, description, appointmentDate, startTime, endTime, location, notes } = req.body;

    // Validate required fields
    if (!clientId || !staffId || !title || !appointmentDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clientId, staffId, title, appointmentDate, and startTime are required'
      });
    }

    const appointment = new Appointment({
      clientId,
      staffId,
      supervisorId: req.user.id || req.user._id,
      title,
      description,
      appointmentDate,
      startTime,
      endTime,
      location,
      notes
    });

    await appointment.save();
    await appointment.populate('clientId staffId', 'name');

    // Emit socket event to notify staff
    if (req.io) {
      req.io.to(`staff_${staffId}`).emit('appointmentCreated', appointment);
    }

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: error.message
    });
  }
};

/**
 * Get all appointments with filters
 */
exports.getAppointments = async (req, res) => {
  try {
    const { status, staffId, clientId, dateRange, upcoming } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (staffId && staffId !== 'all') filter.staffId = staffId;
    if (clientId && clientId !== 'all') filter.clientId = clientId;

    // Upcoming appointments
    if (upcoming === 'true') {
      filter.appointmentDate = { $gte: new Date() };
      filter.status = 'Scheduled';
    }

    // Date range filtering
    if (dateRange && dateRange !== 'all' && !upcoming) {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const date = now.getUTCDate();

      filter.appointmentDate = {};
      if (dateRange === 'week') {
        filter.appointmentDate.$gte = new Date(Date.UTC(year, month, date - 7));
      } else if (dateRange === 'month') {
        filter.appointmentDate.$gte = new Date(Date.UTC(year, month, date - 30));
      } else if (dateRange === '3months') {
        filter.appointmentDate.$gte = new Date(Date.UTC(year, month, date - 90));
      }
    }

    const appointments = await Appointment.find(filter)
      .populate('clientId', 'name ndisNumber careLevel')
      .populate('staffId', 'name email phone')
      .populate('supervisorId', 'name')
      .sort({ appointmentDate: 1, startTime: 1 });

    res.json({
      success: true,
      data: appointments,
      total: appointments.length
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

/**
 * Update an appointment
 */
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('clientId staffId supervisorId', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Notify staff of update
    if (req.io) {
      req.io.to(`staff_${appointment.staffId._id}`).emit('appointmentUpdated', appointment);
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
};

/**
 * Cancel an appointment
 */
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = 'Cancelled';
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = cancellationReason;

    await appointment.save();
    await appointment.populate('clientId staffId supervisorId', 'name');

    // Notify staff of cancellation
    if (req.io) {
      req.io.to(`staff_${appointment.staffId._id}`).emit('appointmentCancelled', appointment);
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
};
