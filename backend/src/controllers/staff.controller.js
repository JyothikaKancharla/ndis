const Note = require('../models/Note');
const Assignment = require('../models/Assignment');
const Trip = require('../models/Trip');
const Client = require('../models/Client');
const Appointment = require('../models/Appointment');
const { calculateDynamicStatus, formatDateDisplay } = require('../utils/assignmentStatus');

/**
 * Get staff's own notes
 */
exports.getStaffNotes = async (req, res) => {
  try {
    const { shift, fromDate, toDate, status, client, category } = req.query;
    
    const filter = { staffId: req.user.id };
    
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
      } else {
        filter.shift = shift;
      }
    }
    
    if (status && status !== 'all') filter.status = status;
    if (client && client !== 'all') filter.clientId = client;
    if (category && category !== 'all') filter.category = category;
    
    if (fromDate || toDate) {
      filter.shiftDate = {};
      if (fromDate) filter.shiftDate.$gte = new Date(fromDate);
      if (toDate) filter.shiftDate.$lte = new Date(toDate);
    }
    
    const notes = await Note.find(filter)
      .populate('clientId', 'name room careLevel')
      .sort({ shiftDate: -1, createdAt: -1 });
    
    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Error fetching staff notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message
    });
  }
};
/**
 * Get staff shifts overview
 */
exports.getShiftsOverview = async (req, res) => {
  try {
    const staffId = req.params.staffId || req.user.id || req.user._id;

    console.log(`\n📊 [getShiftsOverview] Staff ID: ${staffId}`);
    console.log(`   Params staffId: ${req.params.staffId}, User id: ${req.user.id}, User _id: ${req.user._id}`);

    // Get all assignments for this staff member - only active ones, including upcoming
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);
    
    // Query: Get assignments that:
    // 1. Belong to this staff member
    // 2. Are marked as active
    // 3. Started on or before next week
    const allAssignments = await Assignment.find({ 
      staffId,
      isActive: true,
      startDate: { $lte: nextWeek }  // Started by next week
    })
      .populate('clientId', 'name room careLevel')
      .sort({ startDate: -1 });

    console.log(`\n📅 [getShiftsOverview] Query: staffId=${staffId}, today=${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}, nextWeek=${nextWeek.getFullYear()}-${String(nextWeek.getMonth()+1).padStart(2,'0')}-${String(nextWeek.getDate()).padStart(2,'0')}`);
    console.log(`Found ${allAssignments.length} total assignments matching query`);
    allAssignments.forEach((a, i) => {
      const startDateStr = new Date(a.startDate).toLocaleDateString('en-CA');
      console.log(`  [${i}] ${a.clientId?.name} - ${a.shift} on ${startDateStr} (Status: ${a.status})`);
    });

    const activeAssignments = allAssignments;

    // Get current time in minutes
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Helper to parse shift time
    const parseShiftTime = (timeStr) => {
      const match = timeStr.match(/(\d+):(\d+)\s(AM|PM)/i);
      if (!match) return null;
      let hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return hour * 60 + minute;
    };
    
    const upcomingCount = activeAssignments.filter(assignment => {
      if (!assignment.isActive) return false;
      
      const startDate = new Date(assignment.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      // For future dates, count as upcoming
      const isUpcoming = startDate > today;
      const startDateFormatted = startDate.getFullYear() + '-' + String(startDate.getMonth()+1).padStart(2,'0') + '-' + String(startDate.getDate()).padStart(2,'0');
      const todayFormatted = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
      console.log(`    📌 ${assignment.clientId?.name}: startDate=${startDateFormatted}, today=${todayFormatted}, isUpcoming=${isUpcoming}`);
      return isUpcoming;
    }).length;

    const pastCount = allAssignments.filter(assignment => {
      let endDate;
      if (assignment.endDate) {
        endDate = new Date(assignment.endDate);
      } else {
        // Default: assignments last 1 month from start date
        endDate = new Date(assignment.startDate);
        endDate.setMonth(endDate.getMonth() + 1);
      }
      endDate.setHours(0, 0, 0, 0);
      return endDate < today;
    }).length;

    console.log(`\n✅ [getShiftsOverview] Final counts: upcomingCount=${upcomingCount}, pastCount=${pastCount}, totalAssignments=${activeAssignments.length}`);

    // Add computed status to each assignment
    const assignmentsWithStatus = activeAssignments.map(assignment => {
      const computed = calculateDynamicStatus(
        assignment.startDate,
        assignment.endDate,
        assignment.shift
      );
      const dateDisplay = formatDateDisplay(assignment.startDate);

      return {
        ...assignment.toObject(),
        computedStatus: computed.status,
        statusBadge: computed.badge,
        shiftPhase: computed.shiftPhase,
        isShiftActive: computed.shiftPhase === 'active',
        dateDisplay: dateDisplay.relative,
        fullDate: dateDisplay.full,
        shortDate: dateDisplay.short
      };
    });

    // Sort by status priority: Current > Pending > Previous
    const statusPriority = { 'Current': 0, 'Pending': 1, 'Previous': 2 };
    assignmentsWithStatus.sort((a, b) =>
      (statusPriority[a.computedStatus] || 99) - (statusPriority[b.computedStatus] || 99)
    );

    // Recalculate counts based on computed status
    const currentCount = assignmentsWithStatus.filter(a => a.computedStatus === 'Current').length;
    const pendingCount = assignmentsWithStatus.filter(a => a.computedStatus === 'Pending').length;
    const previousCount = assignmentsWithStatus.filter(a => a.computedStatus === 'Previous').length;

    res.json({
      success: true,
      data: {
        assignments: assignmentsWithStatus,
        upcomingShifts: [],
        pastShifts: [],
        totalAssignments: assignmentsWithStatus.length,
        currentCount,
        pendingCount,
        previousCount,
        upcomingCount: pendingCount,
        pastCount: previousCount
      }
    });
  } catch (error) {
    console.error('Error fetching shifts overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shifts overview',
      error: error.message
    });
  }
};
/**
 * Create new note
 */
exports.createNote = async (req, res) => {
  try {
    const { clientId, category, content, shift, shiftDate } = req.body;
    
    // Validate required fields
    if (!clientId || !category || !content || !shift || !shiftDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clientId, category, content, shift, shiftDate'
      });
    }
    
    const note = new Note({
      staffId: req.user.id,
      clientId,
      category,
      content,
      shift,
      shiftDate: new Date(shiftDate),
      status: 'Draft'
    });
    
    await note.save();
    await note.populate('clientId', 'name room careLevel');
    
    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note',
      error: error.message
    });
  }
};

/**
 * Update draft note
 */
exports.updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { content, status, submitForReview } = req.body;
    
    // Can only update unlocked notes or notes staff created
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }
    
    if (note.staffId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own notes'
      });
    }
    
    // Can only edit unlocked notes (staff can edit after supervisor unlocks)
    if (note.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit locked notes. Request unlock from supervisor.'
      });
    }
    
    console.log('📝 Updating note with content:', { content, status });

    // Track edit in history if content changed
    if (content !== undefined && content.trim() && content.trim() !== note.content) {
      // Initialize editHistory if doesn't exist
      if (!note.editHistory) note.editHistory = [];

      // Push edit record
      note.editHistory.push({
        editedAt: new Date(),
        editedBy: req.user.id || req.user._id,
        previousContent: note.content.substring(0, 200),
        reason: note.unlockedAt ? 'Edited after supervisor unlock' : 'Staff edit'
      });

      note.lastEditedAt = new Date();
      note.content = content.trim();

      console.log(`📝 Edit tracked in history. Total edits: ${note.editHistory.length}`);
    } else if (content !== undefined && content.trim()) {
      note.content = content.trim();
    }

    // Keep status as Draft unless submitting for review
    if (status && status !== 'Draft') {
      note.status = status;
    }

    // Return note to Review stage for re-review
    if (submitForReview) {
      note.isLocked = false;
      note.lockedAt = null;
      note.lockedBy = null;
      note.status = 'Review';
    }

    await note.save();
    await note.populate('clientId', 'name room careLevel');

    console.log('✅ Note updated successfully (still unlocked for further edits)');

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: note
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: error.message
    });
  }
};

/**
 * Delete a note (staff can only delete their own unlocked notes)
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

    if (note.staffId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own notes'
      });
    }

    if (note.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete locked notes. Request unlock from supervisor first.'
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
 * Lock note for supervisor review
 */
exports.lockNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { incidentConfirmed } = req.body; // Flag from frontend confirming no incident or incident already filed

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    if (note.staffId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only lock your own notes'
      });
    }

    // Check for incident keywords using clinical analyzer
    const { analyzeNoteContent, hasIncidentReport } = require('../utils/noteAnalyzer');
    const analysis = analyzeNoteContent(note.content);

    // If incident detected and not confirmed by staff, return warning
    if (analysis.incident_report_required && !incidentConfirmed && !hasIncidentReport(note)) {
      return res.status(400).json({
        success: false,
        message: 'Incident detected in note',
        incident_detected: true,
        incident_details: {
          keywords: analysis.keywords_found,
          severity: analysis.sentiment,
          reminder: 'This note appears to contain an incident. Please confirm incident status before locking.'
        }
      });
    }

    note.isLocked = true;
    note.lockedAt = new Date();
    note.lockedBy = req.user.id;
    note.status = 'Pending';

    await note.save();

    res.json({
      success: true,
      message: 'Note locked and submitted for review',
      data: note
    });
  } catch (error) {
    console.error('Error locking note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lock note',
      error: error.message
    });
  }
};

/**
 * Get staff's assigned clients
 */
exports.getAssignedClients = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      staffId: req.user.id,
      isActive: true
    }).populate('clientId');
    
    console.log('📌 Found assignments:', assignments.length);
    
    // Extract unique clients
    const uniqueClients = [];
    const seenIds = new Set();
    
    for (const assignment of assignments) {
      const clientId = assignment.clientId._id.toString();
      if (!seenIds.has(clientId)) {
        seenIds.add(clientId);
        uniqueClients.push(assignment.clientId);
      }
    }

    console.log('📌 Unique clients:', uniqueClients.length);

    // Convert to plain objects and return all client data
    const clientsData = uniqueClients.map(client => {
      const clientObj = client.toObject ? client.toObject() : JSON.parse(JSON.stringify(client));
      return {
        _id: clientObj._id,
        name: clientObj.name,
        code: clientObj.code,
        ndisNumber: clientObj.ndisNumber,
        dateOfBirth: clientObj.dateOfBirth,
        room: clientObj.room,
        careLevel: clientObj.careLevel,
        address: clientObj.address,
        emergencyContact: clientObj.emergencyContact,
        isActive: clientObj.isActive
      };
    });
    
    console.log('✅ Returning', clientsData.length, 'clients with full details');
    
    res.json({
      success: true,
      data: clientsData
    });
  } catch (error) {
    console.error('Error fetching assigned clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned clients',
      error: error.message
    });
  }
};

/**
 * Get staff's shift assignments
 */
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      staffId: req.user.id,
      isActive: true
    })
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
 * Get staff's trips
 */
exports.getTrips = async (req, res) => {
  try {
    const { status, fromDate, toDate } = req.query;
    
    const filter = { staffId: req.user.id };
    if (status) filter.status = status;
    if (fromDate || toDate) {
      filter.tripDate = {};
      if (fromDate) filter.tripDate.$gte = new Date(fromDate);
      if (toDate) filter.tripDate.$lte = new Date(toDate);
    }
    
    const trips = await Trip.find(filter)
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
 * Create new trip
 */
exports.createTrip = async (req, res) => {
  try {
    const { clientId, tripDate, startTime, endTime, relatedShift, purpose, startOdometer, endOdometer } = req.body;
    
    // Validate required fields
    if (!clientId || !tripDate || !startTime || !endTime || !purpose || startOdometer === undefined || endOdometer === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clientId, tripDate, startTime, endTime, purpose, startOdometer, endOdometer'
      });
    }
    
    if (endOdometer <= startOdometer) {
      return res.status(400).json({
        success: false,
        message: 'End odometer must be greater than start odometer'
      });
    }
    
    const trip = new Trip({
      staffId: req.user.id,
      clientId,
      tripDate: new Date(tripDate),
      startTime,
      endTime,
      relatedShift,
      purpose,
      startOdometer,
      endOdometer,
      totalDistance: endOdometer - startOdometer,
      status: 'Pending'
    });
    
    await trip.save();
    await trip.populate('clientId', 'name');
    
    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: trip
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create trip',
      error: error.message
    });
  }
};
/**
 * Get staff dashboard summary
 */
exports.getDashboard = async (req, res) => {
  try {
    const staffId = req.user.id || req.user._id;

    console.log('📊 [getDashboard] Fetching dashboard for staff:', staffId);
    console.log('   User info:', { name: req.user.name, email: req.user.email, id: req.user.id, _id: req.user._id });

    // Fetch the user's current name directly from the DB so the greeting is always accurate
    // (the JWT name can be stale if the user's name was updated since last login)
    const User = require('../models/User');
    const staffUser = await User.findById(staffId).select('name');

    // Get total notes count
    const totalNotes = await Note.countDocuments({ staffId });

    // Get pending notes count
    const pendingNotes = await Note.countDocuments({ staffId, status: 'Pending' });

    // Get verified notes count
    const verifiedNotes = await Note.countDocuments({ staffId, status: 'Approved' });

    // Get assigned clients - try both id formats
    let assignedClientsIds = await Assignment.find({ staffId, isActive: true })
      .distinct('clientId');
    
    console.log(`   [Query 1] Assignments found with staffId=${staffId}:`, assignedClientsIds.length);

    // If no results, try with _id
    if (assignedClientsIds.length === 0 && req.user._id !== staffId) {
      assignedClientsIds = await Assignment.find({ staffId: req.user._id, isActive: true })
        .distinct('clientId');
      console.log(`   [Query 2] Assignments found with _id=${req.user._id}:`, assignedClientsIds.length);
    }

    // Get assignments to find TODAY's shift - any assignment that spans today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    let assignments = await Assignment.find({ 
      staffId, 
      isActive: true,
      startDate: { $lte: endOfToday },  // Assignment started today or earlier
      $or: [
        { endDate: { $gte: today } },  // Assignment ends today or later
        { endDate: { $exists: false } }  // Or has no end date
      ]
    });
    
    console.log(`   [Query 1] Assignment documents found spanning TODAY (${today.toISOString()}) with staffId=${staffId}:`, assignments.length);
    if (assignments.length > 0) {
      console.log('   Assignment data:', { 
        shift: assignments[0].shift, 
        startDate: assignments[0].startDate,
        endDate: assignments[0].endDate,
        staffId: assignments[0].staffId 
      });
    }

    // If no results, try with _id
    if (assignments.length === 0 && req.user._id !== staffId) {
      assignments = await Assignment.find({ 
        staffId: req.user._id, 
        isActive: true,
        startDate: { $lte: endOfToday },
        $or: [
          { endDate: { $gte: today } },
          { endDate: { $exists: false } }
        ]
      });
      console.log(`   [Query 2] Assignment documents found spanning TODAY with _id=${req.user._id}:`, assignments.length);
      if (assignments.length > 0) {
        console.log('   Assignment data:', { 
          shift: assignments[0].shift, 
          startDate: assignments[0].startDate,
          endDate: assignments[0].endDate,
          staffId: assignments[0].staffId 
        });
      }
    }

    let shift = null;
    let shiftType = null; // 'active' or null
    let daysPerWeek = 0;

    // Helper function to check if a shift is CURRENTLY active (running right now)
    const isShiftCurrentlyActive = (assignment) => {
      const computed = calculateDynamicStatus(
        assignment.startDate,
        assignment.endDate,
        assignment.shift
      );
      // Return true ONLY if shift is currently active (not upcoming, not completed)
      return computed.shiftPhase === 'active';
    };

    // Filter assignments to find one that is CURRENTLY active (running right now)
    const activeAssignment = assignments.find(isShiftCurrentlyActive);

    if (activeAssignment) {
      const assignment = activeAssignment;

      // Parse shift string like "10:00 PM - 6:00 AM" into components
      const shiftRegex = /(\d+:\d+\s+(?:AM|PM))\s*-\s*(\d+:\d+\s+(?:AM|PM))/i;
      const shiftMatch = assignment.shift.match(shiftRegex);

      console.log('   📋 Assignment shift:', assignment.shift);
      console.log('   🔍 Shift regex match:', shiftMatch);

      let startTime = '7:00 AM';
      let endTime = '3:00 PM';

      if (shiftMatch && shiftMatch[1] && shiftMatch[2]) {
        startTime = shiftMatch[1].trim();
        endTime = shiftMatch[2].trim();
        console.log('   ✅ Parsed shift times:', startTime, endTime);
      } else {
        console.log('   ⚠️ Shift parsing failed, using defaults');
      }

      // Calculate dynamic status
      const computed = calculateDynamicStatus(
        assignment.startDate,
        assignment.endDate,
        assignment.shift
      );
      const dateDisplay = formatDateDisplay(assignment.startDate);

      shift = {
        startTime: startTime,
        endTime: endTime,
        fullShift: assignment.shift,
        date: assignment.startDate,
        days: assignment.daysPerWeek || 0,
        computedStatus: computed.status,
        statusBadge: computed.badge,
        shiftPhase: computed.shiftPhase,
        isShiftActive: computed.shiftPhase === 'active',
        dateDisplay: dateDisplay.relative,
        fullDate: dateDisplay.full,
        shortDate: dateDisplay.short
      };
      shiftType = 'active';
      daysPerWeek = assignment.daysPerWeek || 0;
      console.log('   ✅ Currently active shift found:', shift);
    } else {
      // No currently active shift - return null (frontend will show empty state)
      console.log('   ⚠️ No currently active shift found');
      shift = null;
      shiftType = null;
    }

    // Get recent notes for activity feed (last 7 days or most recent 10)
    // This provides a better view of recent activity for the logged-in staff
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentNotes = await Note.find({
      staffId,
      createdAt: { $gte: sevenDaysAgo }
    })
      .populate('clientId', 'name room')
      .sort({ createdAt: -1 })
      .limit(10);

    const dashboardData = {
      staffName: staffUser?.name || req.user.name || 'Staff',
      shift,
      shiftType,  // 'today' or 'upcoming' or null
      daysPerWeek,
      clientCount: assignedClientsIds.length,
      totalNotes,
      pendingNotes,
      verifiedNotes,
      recentNotes
    };
    
    console.log('✅ Dashboard data:', {
      shift: dashboardData.shift,
      clientCount: dashboardData.clientCount,
      daysPerWeek: dashboardData.daysPerWeek
    });

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching staff dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard',
      error: error.message
    });
  }
};

/**
 * Get all notes for a specific client
 */
exports.getClientNotes = async (req, res) => {
  try {
    const { clientId } = req.params;

    // Verify staff member has access to this client (active or completed assignment)
    const assignment = await Assignment.findOne({
      staffId: req.user.id,
      clientId: clientId,
      $or: [{ isActive: true }, { status: 'Previous' }]
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this client'
      });
    }

    const notes = await Note.find({ clientId: clientId, staffId: req.user.id })
      .populate('clientId', 'name room careLevel')
      .sort({ createdAt: -1 });

    console.log('📋 Retrieved notes count:', notes.length);
    notes.forEach((n, i) => {
      console.log(`  Note ${i + 1}:`, {
        content: n.content.substring(0, 30) + '...',
        noteType: n.noteType,
        isLocked: n.isLocked,
        status: n.status
      });
    });

    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Error fetching client notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message
    });
  }
};

/**
 * Create a note for a specific client
 */
exports.createClientNote = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { content, noteType, locked, status, category } = req.body;

    // Validate required fields
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    // Reuse assignment from validateActiveShift middleware (already validated)
    // For staff the middleware attaches `req.assignment`. For supervisors/admins
    // we allow creating consolidated notes even if `req.assignment` is absent.
    const assignment = req.assignment;
    if (req.user.role === 'staff' && !assignment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this client'
      });
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use assignment shift if available, fallback to time-based for supervisors/admins
    const shift = assignment?.shift || (() => {
      const h = new Date().getHours();
      if (h >= 7 && h < 15) return '7:00 AM - 3:00 PM';
      if (h >= 15 && h < 23) return '3:00 PM - 11:00 PM';
      return '11:00 PM - 7:00 AM';
    })();

    console.log('📌 Creating note with params:', { locked, status, noteType, shift });

    const note = new Note({
      staffId: req.user.id,
      clientId: clientId,
      content: content.trim(),
      category: category || 'General',
      noteType: noteType || 'text',
      shiftDate: today,
      shift: shift,
      status: status || 'Draft',
      isLocked: locked || false,
      lockedAt: locked ? new Date() : null,
      lockedBy: locked ? req.user.id : null
    });

    console.log('📝 Note object before save:', {
      noteType: note.noteType,
      isLocked: note.isLocked,
      status: note.status,
      lockedAt: note.lockedAt,
      lockedBy: note.lockedBy
    });

    await note.save();
    
    console.log('✅ Note created, fields:', {
      noteType: note.noteType,
      isLocked: note.isLocked,
      status: note.status,
      lockedAt: note.lockedAt,
      lockedBy: note.lockedBy
    });

    // If this is a consolidated note, mark all today's draft notes as Consolidated
    if (noteType === 'consolidated') {
      console.log('📌 Consolidating draft notes...');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      console.log('Looking for review notes with date between:', todayStart, 'and', todayEnd);

      try {
        const draftNotes = await Note.find({
          clientId: clientId,
          staffId: req.user.id,
          status: 'Review',
          isLocked: false,
          shiftDate: { $gte: todayStart, $lte: todayEnd },
          _id: { $ne: note._id }
        });

        console.log(`Found ${draftNotes.length} review notes to consolidate`);

        if (draftNotes.length > 0) {
          const result = await Note.updateMany(
            {
              _id: { $in: draftNotes.map(n => n._id) }
            },
            {
              $set: {
                status: 'Consolidated',
                isLocked: true,
                lockedAt: new Date(),
                lockedBy: req.user.id
              }
            }
          );
          console.log(`✅ Updated ${result.modifiedCount} notes to Consolidated`);
        }
      } catch (err) {
        console.error('⚠️ Error consolidating draft notes:', err);
      }
    }

    await note.populate('clientId', 'name room careLevel');

    console.log('✅ Note created with locked status:', note.isLocked, 'status:', note.status);

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note
    });
  } catch (error) {
    console.error('Error creating client note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note',
      error: error.message
    });
  }
};

exports.markNoteAsConsolidated = async (req, res) => {
  try {
    const { clientId, noteId } = req.params;

    // Verify staff member has access to this client (active or completed assignment)
    const assignment = await Assignment.findOne({
      staffId: req.user.id,
      clientId: clientId,
      $or: [{ isActive: true }, { status: 'Previous' }]
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this client'
      });
    }

    // Mark individual draft notes as consolidated by locking them
    const note = await Note.findByIdAndUpdate(
      noteId,
      {
        $set: {
          isLocked: true,
          status: 'Consolidated',
          lockedAt: new Date(),
          lockedBy: req.user.id
        }
      },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    console.log('✅ Note marked as consolidated:', noteId);

    res.json({
      success: true,
      message: 'Note marked as consolidated',
      data: note
    });
  } catch (error) {
    console.error('Error marking note as consolidated:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark note as consolidated',
      error: error.message
    });
  }
};

/**
 * Bulk confirm review notes (Review → Consolidated)
 */
exports.confirmReviewNotes = async (req, res) => {
  try {
    const { clientId } = req.params;

    const assignment = await Assignment.findOne({
      staffId: req.user.id,
      clientId: clientId,
      $or: [{ isActive: true }, { status: 'Previous' }]
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this client'
      });
    }

    const result = await Note.updateMany(
      {
        clientId: clientId,
        staffId: req.user.id,
        status: { $in: ['Draft', 'Review'] },
        isLocked: false
      },
      {
        $set: {
          status: 'Consolidated'
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending notes to confirm',
        data: { modifiedCount: 0 }
      });
    }

    console.log(`✅ Confirmed ${result.modifiedCount} review notes to Consolidated`);

    res.json({
      success: true,
      message: `${result.modifiedCount} notes moved to Consolidated`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error confirming review notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm review notes',
      error: error.message
    });
  }
};

/**
 * Bulk lock and send notes to supervisor (Consolidated → Submitted)
 */
exports.lockAndSendNotes = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { incidentConfirmed } = req.body;

    const assignment = await Assignment.findOne({
      staffId: req.user.id,
      clientId: clientId,
      $or: [{ isActive: true }, { status: 'Previous' }]
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this client'
      });
    }

    // Find all consolidated notes ready to submit
    const consolidatedNotes = await Note.find({
      clientId: clientId,
      staffId: req.user.id,
      status: 'Consolidated',
      isLocked: false
    }).sort({ createdAt: 1 });

    if (consolidatedNotes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No consolidated notes found to submit'
      });
    }

    // Incident reporting is voluntary — staff uses the Incident button when needed.
    // Do not block locking and sending based on incident presence.

    // Helper to convert Mongoose subdocuments to plain objects
    const toPlainAttachments = (attachments) => {
      if (!attachments || attachments.length === 0) return [];
      return attachments.map(a => {
        const plain = a.toObject ? a.toObject() : a;
        const { _id, ...rest } = plain;
        return rest;
      });
    };

    // Group notes by shift + shiftDate
    const groups = {};
    for (const note of consolidatedNotes) {
      const dateKey = (note.shiftDate || note.createdAt).toISOString().split('T')[0];
      const groupKey = `${dateKey}_${note.shift}`;
      if (!groups[groupKey]) {
        groups[groupKey] = { shift: note.shift, shiftDate: note.shiftDate || note.createdAt, notes: [] };
      }
      groups[groupKey].notes.push(note);
    }

    const mergedNotes = [];

    for (const groupKey of Object.keys(groups)) {
      const group = groups[groupKey];
      const groupNotes = group.notes;

      // Build entries array from all notes in this group
      const entries = [];
      const allAttachments = [];

      for (const note of groupNotes) {
        // If note already has entries (re-submitted merged doc), spread them
        if (note.entries && note.entries.length > 0) {
          for (const entry of note.entries) {
            const plainAttachments = toPlainAttachments(entry.attachments);
            entries.push({
              content: entry.content,
              noteType: entry.noteType || 'text',
              attachments: plainAttachments,
              createdAt: entry.createdAt
            });
            allAttachments.push(...plainAttachments);
          }
        } else {
          // Individual note — create entry from its fields
          const plainAttachments = toPlainAttachments(note.attachments);
          entries.push({
            content: note.content,
            noteType: note.noteType === 'consolidated' ? 'text' : (note.noteType || 'text'),
            attachments: plainAttachments,
            createdAt: note.createdAt
          });
          allAttachments.push(...plainAttachments);
        }
      }

      // Sort entries chronologically
      entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      // Build combined content string for search/backward compat
      const combinedContent = entries.map(e => {
        const time = new Date(e.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const typeLabel = e.noteType === 'voice' ? 'Voice' : e.noteType === 'file' ? 'File' : 'Text';
        return `[${time} - ${typeLabel}] ${e.content}`;
      }).join('\n\n');

      // Create the merged document
      const mergedNote = new Note({
        staffId: req.user.id,
        clientId: clientId,
        category: 'General',
        noteType: 'consolidated',
        content: combinedContent,
        entries: entries,
        attachments: allAttachments,
        shift: group.shift,
        shiftDate: group.shiftDate,
        status: 'Submitted',
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: req.user.id,
        submittedAt: new Date(),
        startOdometer: assignment.startOdometer || null,
        endOdometer: assignment.endOdometer || null,
        totalDistance: assignment.totalDistance || null,
        odometerStatus: (assignment.startOdometer !== null && assignment.endOdometer !== null) ? 'pending' : null
      });

      await mergedNote.save();
      mergedNotes.push(mergedNote.toObject());

      // Delete the original individual notes
      const noteIds = groupNotes.map(n => n._id);
      await Note.deleteMany({ _id: { $in: noteIds } });

      console.log(`Merged ${groupNotes.length} notes into 1 document for shift ${group.shift} on ${groupKey}`);
    }

    res.json({
      success: true,
      message: `Notes merged and sent to supervisor (${mergedNotes.length} document${mergedNotes.length !== 1 ? 's' : ''})`,
      data: { mergedCount: mergedNotes.length, mergedNotes }
    });
  } catch (error) {
    console.error('Error locking and sending notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lock and send notes',
      error: error.message
    });
  }
};

exports.unlockNote = async (req, res) => {
  try {
    const { clientId, noteId } = req.params;

    // Verify supervisor/admin has access to this client
    const assignment = await Assignment.findOne({
      staffId: req.user.id,
      clientId: clientId,
      isActive: true
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this client'
      });
    }

    // Only supervisors and admins can unlock notes
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only supervisors can unlock notes'
      });
    }

    // Unlock the note
    const note = await Note.findByIdAndUpdate(
      noteId,
      {
        $set: {
          isLocked: false,
          unlockedAt: new Date(),
          unlockedBy: req.user.id
        }
      },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    console.log('🔓 Note unlocked:', noteId, 'by', req.user.id);

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
 * Upload files for a client
 */
exports.uploadFiles = async (req, res) => {
  try {
    const { clientId } = req.params;
    const fs = require('fs');

    // Verify staff has access to this client
    const assignment = await Assignment.findOne({
      staffId: req.user.id,
      clientId: clientId,
      isActive: true
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this client'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Get today's date for shift
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use assignment shift if available, fallback to time-based for supervisors/admins
    const shift = assignment?.shift || (() => {
      const h = new Date().getHours();
      if (h >= 7 && h < 15) return '7:00 AM - 3:00 PM';
      if (h >= 15 && h < 23) return '3:00 PM - 11:00 PM';
      return '11:00 PM - 7:00 AM';
    })();

    // Create attachments array with web-accessible paths
    const attachments = req.files.map(file => {
      // Convert full disk path to web-accessible path
      // e.g., "C:\...\uploads\clientId\file.jpg" -> "uploads/clientId/file.jpg"
      const relativePath = file.path.split('uploads').pop(); // Get everything after 'uploads'
      const webPath = 'uploads' + relativePath.replace(/\\/g, '/'); // Replace backslashes with forward slashes

      console.log('📸 File path conversion:', {
        original: file.path,
        relative: relativePath,
        webPath: webPath
      });

      return {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: webPath, // Store web-accessible path
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      };
    });

    // Create better content based on file types
    const imageFiles = req.files.filter(f => f.mimetype.startsWith('image/'));
    const otherFiles = req.files.filter(f => !f.mimetype.startsWith('image/'));

    let content = '';
    if (imageFiles.length > 0) {
      content += `${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} uploaded`;
      if (otherFiles.length > 0) {
        content += ` and ${otherFiles.length} file${otherFiles.length > 1 ? 's' : ''}`;
      }
    } else {
      content = `File${req.files.length > 1 ? 's' : ''} uploaded: ${req.files.map(f => f.originalname).join(', ')}`;
    }

    // Create a note with file attachments
    const note = new Note({
      staffId: req.user.id,
      clientId: clientId,
      content: content,
      category: 'General',
      noteType: 'file',
      shiftDate: today,
      shift: shift,
      status: 'Review',
      attachments: attachments,
      isLocked: false
    });

    await note.save();
    await note.populate('clientId', 'name room careLevel');

    console.log('📎 Files uploaded:', req.files.length, 'for client:', clientId);

    res.status(201).json({
      success: true,
      message: 'Files uploaded successfully',
      data: note
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error.message
    });
  }
};

/**
 * Get files for a client
 */
exports.getClientFiles = async (req, res) => {
  try {
    const { clientId } = req.params;

    // Verify staff has access to this client
    const assignment = await Assignment.findOne({
      staffId: req.user.id,
      clientId: clientId,
      isActive: true
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this client'
      });
    }

    // Get notes with file attachments
    const notes = await Note.find({
      clientId: clientId,
      staffId: req.user.id,
      noteType: 'file',
      'attachments.0': { $exists: true }
    })
      .populate('clientId', 'name room careLevel')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('Error fetching client files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files',
      error: error.message
    });
  }
};

/**
 * Delete a file attachment
 */
exports.deleteFile = async (req, res) => {
  try {
    const { clientId, fileId } = req.params;
    const fs = require('fs');

    const note = await Note.findOne({
      clientId: clientId,
      'attachments._id': fileId
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    if (note.staffId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own files'
      });
    }

    if (note.isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete files from locked notes'
      });
    }

    // Find and remove the file
    const attachment = note.attachments.id(fileId);
    if (attachment) {
      // Delete physical file
      if (fs.existsSync(attachment.path)) {
        fs.unlinkSync(attachment.path);
      }
      note.attachments.pull(fileId);
      await note.save();
    }

    console.log('🗑️ File deleted:', fileId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
};

/**
 * Get client assignment for the authenticated staff
 * Used by frontend to determine shift status and note creation permissions
 */
exports.getClientAssignment = async (req, res) => {
  try {
    const { clientId } = req.params;
    const staffId = req.user.id;

    // Find active assignment for this staff-client pair
    const assignment = await Assignment.findOne({
      staffId,
      clientId,
      isActive: true
    }).populate('clientId', 'name room');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'No active assignment found for this client'
      });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error fetching client assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment',
      error: error.message
    });
  }
};

/**
 * Update odometer readings for a client assignment
 * PUT /api/staff/clients/:clientId/odometer
 */
exports.updateOdometer = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { startOdometer, endOdometer } = req.body;

    const assignment = await Assignment.findOne({
      staffId: req.user.id,
      clientId: clientId,
      $or: [{ isActive: true }, { status: 'Previous' }]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'No assignment found for this client'
      });
    }

    if (startOdometer !== undefined) {
      assignment.startOdometer = startOdometer;
    }
    if (endOdometer !== undefined) {
      assignment.endOdometer = endOdometer;
      if (assignment.startOdometer !== null && endOdometer > assignment.startOdometer) {
        assignment.totalDistance = endOdometer - assignment.startOdometer;
      }
    }
    if (assignment.startOdometer !== null && assignment.endOdometer !== null) {
      assignment.odometerStatus = 'pending';
    }

    await assignment.save();

    res.json({
      success: true,
      message: 'Odometer reading saved successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error saving odometer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save odometer reading',
      error: error.message
    });
  }
};
/**
 * APPOINTMENT MANAGEMENT (Staff Side)
 */

/**
 * Get staff's appointments
 */
exports.getMyAppointments = async (req, res) => {
  try {
    const staffId = req.user.id || req.user._id;
    const { status, upcoming } = req.query;

    const filter = { staffId };

    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get upcoming appointments only
    if (upcoming === 'true') {
      filter.appointmentDate = { $gte: new Date() };
      filter.status = 'Scheduled';
    }

    const appointments = await Appointment.find(filter)
      .populate('clientId', 'name ndisNumber careLevel address')
      .populate('supervisorId', 'name email')
      .sort({ appointmentDate: 1, startTime: 1 });

    res.json({
      success: true,
      data: appointments,
      total: appointments.length
    });
  } catch (error) {
    console.error('Get my appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

/**
 * Mark appointment as completed
 */
exports.completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const staffId = req.user.id || req.user._id;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify this appointment belongs to the staff member
    if (appointment.staffId.toString() !== staffId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only complete your own appointments'
      });
    }

    appointment.status = 'Completed';
    appointment.completedAt = new Date();
    appointment.completedBy = staffId;

    await appointment.save();
    await appointment.populate('clientId supervisorId', 'name');

    res.json({
      success: true,
      message: 'Appointment marked as completed',
      data: appointment
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete appointment',
      error: error.message
    });
  }
};
