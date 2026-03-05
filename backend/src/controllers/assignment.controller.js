const Assignment = require("../models/Assignment");
const mongoose = require("mongoose");

function parseTimeToMinutes(t) {
  // expect HH:mm or H:mm
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function weeksOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

async function createAssignment(req, res) {
  try {
    const { staffId, clientId, weekStartDate, weekEndDate, startTime, endTime } = req.body;
    if (!staffId || !clientId || !weekStartDate || !weekEndDate || !startTime || !endTime)
      return res.status(400).json({ message: "Missing required fields" });

    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    if (endMin <= startMin) return res.status(400).json({ message: "endTime must be after startTime" });

    const wStart = new Date(weekStartDate);
    const wEnd = new Date(weekEndDate);

    // timing conflict: same staff overlapping weeks and overlapping times (only active assignments)
    const existing = await Assignment.find({ staffId: new mongoose.Types.ObjectId(staffId), isActive: true });
    for (const ex of existing) {
      if (weeksOverlap(wStart, wEnd, ex.weekStartDate, ex.weekEndDate)) {
        const exStart = parseTimeToMinutes(ex.startTime);
        const exEnd = parseTimeToMinutes(ex.endTime);
        const overlap = Math.max(startMin, exStart) < Math.min(endMin, exEnd);
        if (overlap) return res.status(409).json({ message: "Timing conflict with existing assignment" });
      }
    }

    // compute initial status (using correct schema enum values)
    const now = new Date();
    let status = "Pending";
    if (now >= wStart && now <= wEnd) status = "Current";
    if (now > wEnd) status = "Previous";

    const assignment = new Assignment({
      staffId,
      clientId,
      weekStartDate: wStart,
      weekEndDate: wEnd,
      startTime,
      endTime,
      status,
      createdBy: req.user && req.user.id ? req.user.id : null
    });

    await assignment.save();

    // emit real-time update to staff room if io available
    const io = req.app && req.app.get("io");
    if (io) io.to(`staff_${staffId}`).emit("assignmentUpdated", assignment);

    res.status(201).json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function updateAssignment(req, res) {
  try {
    const id = req.params.id;
    const update = req.body;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    // Only supervisors allowed by route middleware; still keep createdBy

    // If changing staffId or times, check conflicts
    const staffId = update.staffId || assignment.staffId;
    const weekStart = update.weekStartDate ? new Date(update.weekStartDate) : assignment.weekStartDate;
    const weekEnd = update.weekEndDate ? new Date(update.weekEndDate) : assignment.weekEndDate;
    const startTime = update.startTime || assignment.startTime;
    const endTime = update.endTime || assignment.endTime;

    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    if (endMin <= startMin) return res.status(400).json({ message: "endTime must be after startTime" });

    const others = await Assignment.find({ _id: { $ne: assignment._id }, staffId: new mongoose.Types.ObjectId(staffId) });
    for (const ex of others) {
      if (weeksOverlap(weekStart, weekEnd, ex.weekStartDate, ex.weekEndDate)) {
        const exStart = parseTimeToMinutes(ex.startTime);
        const exEnd = parseTimeToMinutes(ex.endTime);
        const overlap = Math.max(startMin, exStart) < Math.min(endMin, exEnd);
        if (overlap) return res.status(409).json({ message: "Timing conflict with existing assignment" });
      }
    }

    Object.assign(assignment, {
      staffId,
      clientId: update.clientId || assignment.clientId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      startTime,
      endTime
    });

    // recompute status (using correct schema enum values)
    const now = new Date();
    if (now > assignment.weekEndDate) assignment.status = "Previous";
    else if (now >= assignment.weekStartDate && now <= assignment.weekEndDate) assignment.status = "Current";
    else assignment.status = "Pending";

    await assignment.save();

    const io = req.app && req.app.get("io");
    if (io) io.to(`staff_${assignment.staffId}`).emit("assignmentUpdated", assignment);

    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function getStaffAssignments(req, res) {
  try {
    const staffId = req.params.staffId;
    const week = req.query.week; // if 'current', filter to current week
    const q = { staffId: new mongoose.Types.ObjectId(staffId) };
    if (week === "current") {
      const now = new Date();
      q.weekStartDate = { $lte: now };
      q.weekEndDate = { $gte: now };
    }
    const assignments = await Assignment.find(q).populate("clientId").populate("createdBy");
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function getSupervisorAssignments(req, res) {
  try {
    const supervisorId = req.params.supervisorId;
    const assignments = await Assignment.find({ createdBy: supervisorId }).populate("staffId").populate("clientId");
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function updateStatuses() {
  try {
    const { calculateDynamicStatus } = require('../utils/assignmentStatus');
    const activeAssignments = await Assignment.find({ isActive: true });

    let updated = 0;
    for (const assignment of activeAssignments) {
      const computed = calculateDynamicStatus(
        assignment.startDate, assignment.endDate, assignment.shift
      );
      const newStatus = computed.status; // 'Current', 'Pending', or 'Previous'
      const shouldBeActive = newStatus !== 'Previous';

      if (assignment.status !== newStatus || assignment.isActive !== shouldBeActive) {
        assignment.status = newStatus;
        assignment.isActive = shouldBeActive;
        await assignment.save();
        updated++;
      }
    }
    return { updated };
  } catch (err) {
    console.error("Status updater error", err);
  }
}

module.exports = {
  createAssignment,
  updateAssignment,
  getStaffAssignments,
  getSupervisorAssignments,
  updateStatuses
};
