// Get a note by its ID (for staff)
exports.getNoteById = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { noteId } = req.params;
    // Only allow if staff is owner or assigned to the client (optional: for stricter security)
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });
    // Optionally, check if staffId matches note.staffId or is assigned to note.clientId
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Error fetching note", error: err.message });
  }
};
// GET /api/staff/:id/shifts/overview
// Returns: current shift, clients this week, notes recorded this week, shift history (with assigned clients, notes per client, status, etc.)
exports.getShiftsOverviewForStaff = async (req, res) => {
  try {
    const { id } = req.params;
    // 1. Current shift (active)
    const currentShift = await Shift.findOne({ staff: id, status: "active" });

    // 2. All shifts (history)
    const allShifts = await Shift.find({ staff: id }).sort({ date: -1 });

    // 3. Clients assigned this week (unique)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    // Find all clients assigned to this staff
    const allClients = await Client.find({ assignedStaff: id });
    // Find all notes by this staff in the last week
    const notesThisWeek = await Note.find({ staffId: id, createdAt: { $gte: weekAgo } });
    // Unique client count for this week
    const uniqueClientsThisWeek = new Set(notesThisWeek.map(n => n.clientId.toString()));

    // 4. Notes recorded this week (count)
    const notesRecordedThisWeek = notesThisWeek.length;

    // 5. Shift history with assigned clients and notes per client
    const shiftHistory = await Promise.all(
      allShifts.map(async (shift) => {
        // Find all clients assigned to this staff for this shift's date
        // (Assume allClients are assigned for all shifts; if you want per-shift assignment, adjust logic)
        // Find notes for this shift
        const notes = await Note.find({ staffId: id, shiftId: shift._id });
        // Group notes by client
        const clientNoteMap = {};
        notes.forEach(note => {
          const cid = note.clientId.toString();
          if (!clientNoteMap[cid]) clientNoteMap[cid] = [];
          clientNoteMap[cid].push(note);
        });
        // Build assignedClients array for this shift
        const assignedClients = allClients.map(client => {
          const cid = client._id.toString();
          return {
            _id: client._id,
            name: client.name,
            notesRecorded: clientNoteMap[cid] ? clientNoteMap[cid].length : 0
          };
        });
        return {
          _id: shift._id,
          date: shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          status: shift.status,
          assignedClients,
          notesCount: notes.length,
          durationHours: shift.startTime && shift.endTime ? calcDurationHours(shift.startTime, shift.endTime) : null
        };
      })
    );

    res.json({
      currentShift,
      clientsThisWeek: uniqueClientsThisWeek.size,
      notesRecordedThisWeek,
      shiftHistory
    });
  } catch (err) {
    console.error('getShiftsOverviewForStaff error:', err);
    res.status(500).json({ message: "Error fetching shift overview", error: err.message });
  }
};

// Helper to calculate duration in hours from "08:00 AM" to "04:00 PM"
function calcDurationHours(start, end) {
  try {
    const parse = t => {
      const [time, meridian] = t.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (meridian === 'PM' && h !== 12) h += 12;
      if (meridian === 'AM' && h === 12) h = 0;
      return h + m / 60;
    };
    const diff = parse(end) - parse(start);
    return diff > 0 ? diff : 24 + diff;
  } catch {
    return null;
  }
}
const mongoose = require('mongoose');
// Get a single assigned client by clientId (for staff)
exports.getAssignedClientById = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { clientId } = req.params;
    console.log('DEBUG getAssignedClientById:', { staffId, clientId });
    const client = await Client.findOne({ _id: clientId, assignedStaff: staffId });
    console.log('DEBUG found client:', client);
    if (!client) return res.status(404).json({ message: "Client not found or not assigned" });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: "Error fetching client" });
  }
};
// Get notes for a client (only assigned clients)
exports.getNotesByClient = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { clientId } = req.params;
    const { period } = req.query; // 'week', 'month', 'year', 'all' or undefined
    // Only allow if staff is assigned to this client
    let client;
    try {
      let clientIdObj = null, staffIdObj = null;
      if (mongoose.Types.ObjectId.isValid(clientId)) clientIdObj = new mongoose.Types.ObjectId(clientId);
      if (mongoose.Types.ObjectId.isValid(staffId)) staffIdObj = new mongoose.Types.ObjectId(staffId);
      const clientQuery = (clientIdObj && staffIdObj)
        ? { _id: clientIdObj, assignedStaff: staffIdObj }
        : { _id: clientId, assignedStaff: staffId };
      client = await Client.findOne(clientQuery);
    } catch (err) {
      console.error('Error in Client.findOne:', err);
      return res.status(500).json({ message: 'Error finding client', error: err.message });
    }
    if (!client) return res.status(403).json({ message: "Not assigned to this client" });
    let dateFilter = {};
    if (period && period !== 'all') {
      const now = new Date();
      let fromDate;
      if (period === 'week') {
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        fromDate = new Date(now);
        fromDate.setMonth(now.getMonth() - 1);
      } else if (period === 'year') {
        fromDate = new Date(now);
        fromDate.setFullYear(now.getFullYear() - 1);
      }
      if (fromDate) {
        dateFilter.createdAt = { $gte: fromDate };
      }
    }
    let notes = [];
    try {
      let clientIdObj = null, staffIdObj = null;
      if (mongoose.Types.ObjectId.isValid(clientId)) clientIdObj = new mongoose.Types.ObjectId(clientId);
      if (mongoose.Types.ObjectId.isValid(staffId)) staffIdObj = new mongoose.Types.ObjectId(staffId);
      const noteQuery = (clientIdObj && staffIdObj)
        ? { clientId: clientIdObj, staffId: staffIdObj, ...dateFilter }
        : { clientId, staffId, ...dateFilter };
      notes = await Note.find(noteQuery).sort({ createdAt: -1 });
    } catch (err) {
      console.error('Error in Note.find:', err);
      return res.status(500).json({ message: 'Error finding notes', error: err.message });
    }
    res.json(notes);
  } catch (err) {
    console.error('General error in getNotesByClient:', err);
    res.status(500).json({ message: "Error fetching notes", error: err.message });
  }
};

// Create note for assigned client (with optional shiftId, draft, category, and noteType)
exports.createNoteForClient = async (req, res) => {
  try {
    console.log('POST body:', req.body); // DEBUG: log the incoming POST body
    const staffId = req.user.id;
    const { clientId, content, shiftId, draft, category, noteType } = req.body;
    // Only allow if staff is assigned to this client
    const client = await Client.findOne({ _id: clientId, assignedStaff: staffId });
    if (!client) return res.status(403).json({ message: "Not assigned to this client" });
    const note = new Note({ clientId, staffId, content, shiftId, draft: !!draft, category, noteType });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    console.error('Error saving note:', err); // DEBUG: log the error
    res.status(500).json({ message: "Error saving note", error: err.message });
  }
};


// Edit own note (only if staff is owner, not approved)
exports.editNote = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { noteId } = req.params;
    const { content, draft } = req.body;
    const note = await Note.findOne({ _id: noteId, staffId });
    if (!note) return res.status(404).json({ message: "Note not found or not allowed" });
    if (note.status === "Approved") {
      return res.status(403).json({ message: "Cannot edit an approved note" });
    }
    note.content = content;
    if (typeof draft === 'boolean') note.draft = draft;
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Error editing note" });
  }
};

// Finalize note (set status to Pending Review, draft to false)
exports.finalizeNote = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { noteId } = req.params;
    const note = await Note.findOne({ _id: noteId, staffId });
    if (!note) return res.status(404).json({ message: "Note not found or not allowed" });
    if (note.status === "Approved") {
      return res.status(403).json({ message: "Cannot finalize an approved note" });
    }
    note.status = "Pending";
    note.draft = false;
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Error finalizing note" });
  }
};
const Shift = require("../models/Shift");
const Client = require("../models/Client");
const User = require("../models/User");

exports.getDashboard = async (req, res) => {
  try {
    const staffId = req.user.id;
    const activeShift = await Shift.findOne({ staff: staffId, status: "active" });
    const clients = await Client.find({ assignedStaff: staffId });
    const user = await User.findById(staffId).select("name email profilePic role startTime endTime assignmentStart daysPerWeek");
    res.json({
      staffName: user?.name || req.user.name,
      shift: activeShift,
      clientCount: clients.length,
      clients,
      startTime: user?.startTime || null,
      endTime: user?.endTime || null,
      assignmentStart: user?.assignmentStart || null,
      daysPerWeek: user?.daysPerWeek || null
    });
  } catch (err) {
    res.status(500).json({ message: "Dashboard error" });
  }
};

exports.createNote = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { content } = req.body;
    const note = new Note({ text: content, staff: staffId });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: "Error saving note" });
  }
};

// Get staff info by id
exports.getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("name email profilePic role");
    if (!user) return res.status(404).json({ message: "Staff not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching staff" });
  }
};

// Get clients assigned to staff, with careLevel, code, and lastNote (with formatted time)
const Note = require("../models/Note");
exports.getClientsByStaffId = async (req, res) => {
  try {
    const { id } = req.params;
    let clients = [];
    try {
      let objectId = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        objectId = new mongoose.Types.ObjectId(id);
      }
      const query = objectId
        ? { $or: [ { assignedStaff: id }, { assignedStaff: objectId } ] }
        : { assignedStaff: id };
      clients = await Client.find(query);
      console.log('DEBUG getClientsByStaffId - found clients:', clients);
    } catch (err) {
      console.error('Error in Client.find (getClientsByStaffId):', err);
      return res.status(500).json({ message: 'Error finding clients', error: err.message });
    }
    // For each client, fetch the latest note and add careLevel, code, lastNote
    const enriched = await Promise.all(clients.map(async (c, i) => {
      // Find latest note for this client (any staff)
      const lastNote = await Note.findOne({ clientId: c._id }).sort({ createdAt: -1 });
      // Format time for frontend (e.g., Today at 10:30 AM)
      let lastNoteTime = null;
      if (lastNote) {
        const date = new Date(lastNote.createdAt);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        lastNoteTime = isToday ? `Today at ${timeStr}` : date.toLocaleString();
      }
      return {
        ...c.toObject(),
        careLevel: c.careLevel || "Low",
        code: c.code || c._id.toString().slice(-4).toUpperCase(),
        lastNote: lastNote ? { time: lastNoteTime, id: lastNote._id } : null
      };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Error fetching clients" });
  }
};

// Get shifts for staff
exports.getShiftsByStaffId = async (req, res) => {
  try {
    const { id } = req.params;
    const shifts = await Shift.find({ staff: id }).sort({ date: -1 });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching shifts" });
  }
};

// Update profile (name, profilePic)
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id !== id && req.user.role !== "supervisor" && req.user.role !== "government") {
      return res.status(403).json({ message: "Not allowed" });
    }
    const { name, profilePic } = req.body;
    const user = await User.findByIdAndUpdate(id, { name, profilePic }, { new: true }).select("name email profilePic role");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
};
