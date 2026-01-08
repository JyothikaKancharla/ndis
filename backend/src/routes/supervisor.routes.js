
const router = require("express").Router();
const User = require("../models/User");
const Client = require("../models/Client");
const auth = require("../middleware/auth.middleware");
const supervisorController = require("../controllers/supervisor.controller");
const assignedStaffController = require("../controllers/assignedStaff.controller");
const Note = require("../models/Note");

// Update assigned staff details for a client (shift info)
router.put("/clients/:clientId/assigned-staff/:staffId", auth(["supervisor"]), async (req, res) => {
  try {
    const { assignmentStart, daysPerWeek, startTime, endTime } = req.body;
    // Ensure staff exists
    const staff = await User.findById(req.params.staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    // Create or update a Shift document linked to this client (do NOT mutate the User)
    const Shift = require("../models/Shift");
    let shift = await Shift.findOne({ staff: staff._id, client: req.params.clientId, status: "active" });
    if (!shift) {
      shift = new Shift({
        staff: staff._id,
        client: req.params.clientId,
        startTime,
        endTime,
        date: assignmentStart,
        assignmentStart,
        daysPerWeek,
        status: "active"
      });
    } else {
      shift.startTime = startTime;
      shift.endTime = endTime;
      shift.date = assignmentStart;
      shift.assignmentStart = assignmentStart;
      shift.daysPerWeek = daysPerWeek;
      shift.status = "active";
    }
    await shift.save();
    res.json({ message: "Staff assignment updated" });
  } catch (err) {
    res.status(400).json({ message: err.message || "Error updating staff assignment" });
  }
});

// Get assigned staff for a client (detailed)
router.get("/clients/:clientId/assigned-staff", auth(["supervisor"]), assignedStaffController.getAssignedStaffForClient);

// Get discrepancies for a note (for verification UI)
router.get("/notes/:noteId/discrepancies", auth(["supervisor"]), supervisorController.getNoteDiscrepancies);

// Client care notes summary for supervisor dashboard
router.get("/notes-summary", auth(["supervisor"]), supervisorController.getNotesSummary);
// Supervisor dashboard aggregation
router.get("/dashboard", auth(["supervisor"]), supervisorController.getDashboard);

// Update client details
router.put("/clients/:clientId", auth(["supervisor"]), async (req, res) => {
  try {
    const updateFields = (({
        name, dob, gender, address, phone, carePlan, medicalNotes, status, careLevel
      }) => ({ name, dob, gender, address, phone, carePlan, medicalNotes, status, careLevel }))(req.body);
    const client = await Client.findByIdAndUpdate(
      req.params.clientId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  } catch (err) {
    res.status(400).json({ message: err.message || "Error updating client" });
  }
});

// Create new client (must be above /clients/:clientId)
router.post("/clients", auth(["supervisor"]), async (req, res) => {
  try {
    const { name, dob, gender, address, phone, carePlan, medicalNotes, status, assignedStaff = [] } = req.body;
    console.log("[DEBUG] assignedStaff from request:", assignedStaff);
    const client = new Client({ name, dob, gender, address, phone, carePlan, medicalNotes, status, assignedStaff });
    await client.save();
    console.log("[DEBUG] saved client assignedStaff:", client.assignedStaff);
    // Update assigned staff's assignedClients array
    if (Array.isArray(assignedStaff) && assignedStaff.length > 0) {
      const User = require("../models/User");
      await User.updateMany(
        { _id: { $in: assignedStaff } },
        { $addToSet: { assignedClients: client._id } }
      );
    }
    res.status(201).json(client);
  } catch (err) {
    res.status(400).json({ message: err.message || "Error creating client" });
  }
});

// Get client details by ID (with ObjectId check)
router.get("/clients/:clientId", auth(["supervisor"]), async (req, res) => {
  const { clientId } = req.params;
  if (!clientId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "Invalid client ID" });
  }
  const client = await Client.findById(clientId).populate("assignedStaff", "_id name email");
  if (!client) return res.status(404).json({ message: "Client not found" });
  res.json(client);
});

// Get assigned staff for a client
router.get("/clients/:clientId/staff", auth(["supervisor"]), async (req, res) => {
  const client = await Client.findById(req.params.clientId).populate("assignedStaff", "_id name email");
  if (!client) return res.status(404).json({ message: "Client not found" });
  res.json(client.assignedStaff);
});

// Get historical notes for a client (optionally by date/shift)
router.get("/clients/:clientId/notes", auth(["supervisor"]), async (req, res) => {
  const { date, shiftId } = req.query;
  const filter = { clientId: req.params.clientId };
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: start, $lte: end };
  }
  if (shiftId) filter.shiftId = shiftId;
  const notes = await Note.find(filter).populate("staffId", "name").populate("shiftId").sort({ createdAt: -1 });
  res.json(notes);
});
// Get all notes (optionally filter by status)
router.get("/notes", auth(["supervisor"]), supervisorController.getAllNotes);

// Approve or reject a note
router.put("/notes/:noteId/verify", auth(["supervisor"]), supervisorController.verifyNote);

// Get all staff (include assignment fields so frontend can enrich missing shifts)
router.get("/staff", auth(["supervisor"]), async (req, res) => {
  const staff = await User.find({ role: "staff" }).select("_id name email startTime endTime assignmentStart daysPerWeek status");
  res.json(staff);
});


// Get all clients (with all details for management)
router.get("/clients", auth(["supervisor"]), async (req, res) => {
  const clients = await Client.find();
  res.json(clients);
});

// Assign clients to staff (replace all assignments for that staff)
router.post("/assign-clients", auth(["supervisor"]), async (req, res) => {
  const { staffId, clientIds } = req.body;
  if (!staffId || !Array.isArray(clientIds)) return res.status(400).json({ message: "Missing staffId or clientIds" });
  // Remove staffId from all clients first
  await Client.updateMany({}, { $pull: { assignedStaff: staffId } });
  // Add staffId to selected clients
  await Client.updateMany({ _id: { $in: clientIds } }, { $addToSet: { assignedStaff: staffId } });
  res.json({ message: "Clients assigned to staff" });
});

module.exports = router;

// Assign client to staff
router.put("/clients/:clientId/assign", auth(["supervisor"]), async (req, res) => {
  const { staffId } = req.body;
  await Client.findByIdAndUpdate(req.params.clientId, { $addToSet: { assignedStaff: staffId } });
  res.json({ message: "Client assigned" });
});

// Unassign client from staff
router.put("/clients/:clientId/unassign", auth(["supervisor"]), async (req, res) => {
  const { staffId } = req.body;
  await Client.findByIdAndUpdate(req.params.clientId, { $pull: { assignedStaff: staffId } });
  res.json({ message: "Client unassigned" });
});

// List all staff (for assignment UI)
router.get("/staff", auth(["supervisor"]), async (req, res) => {
  const staff = await User.find({ role: "staff" });
  res.json(staff);
});

// Staff-Client Assignments page
router.get("/assignments", auth(["supervisor"]), supervisorController.getStaffClientAssignments);

module.exports = router;
