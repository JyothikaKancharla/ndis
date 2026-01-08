const User = require("../models/User");
const Client = require("../models/Client");
const Shift = require("../models/Shift");
const Note = require("../models/Note");

/* ======================================================
   NOTE DISCREPANCIES
   GET /api/supervisor/notes/:noteId/discrepancies
====================================================== */
exports.getNoteDiscrepancies = async (req, res) => {
  const { noteId } = req.params;

  // Demo/static response (as requested)
  res.json({
    discrepancies: [
      "Medication time recorded as 09:15 AM but staff shift started at 09:00 AM",
      "Note mentions 'orange juice' but dietary plan specifies apple juice only"
    ]
  });
};
exports.createClient = async (req, res) => {
  try {
    const {
      name,
      priority,
      ...rest
    } = req.body;

    const client = new Client({
      name,
      priority: priority
        ? priority.charAt(0).toUpperCase() + priority.slice(1)
        : "Normal",
      ...rest,
    });

    await client.save();

    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ message: "Failed to create client" });
  }
};


// Update client details
exports.updateClient = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const updates = req.body;

    // Normalize priority
    if (updates.priority) {
      updates.priority =
        updates.priority.charAt(0).toUpperCase() +
        updates.priority.slice(1).toLowerCase();
    }

    // Normalize careLevel
    if (updates.careLevel) {
      updates.careLevel =
        updates.careLevel.charAt(0).toUpperCase() +
        updates.careLevel.slice(1).toLowerCase();
    }

    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      updates,
      { new: true }
    );

    if (!updatedClient)
      return res.status(404).json({ message: "Client not found" });

    res.json(updatedClient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update client" });
  }
};



/* ======================================================
   NOTES SUMMARY (CLIENT-WISE)
   GET /api/supervisor/notes-summary
====================================================== */
exports.getNotesSummary = async (req, res) => {
  try {
    const clients = await Client.find();
    const notes = await Note.find()
      .populate("staffId", "name")
      .populate("clientId", "name");

    // Group notes by client
    const notesByClient = {};
    notes.forEach(note => {
      const cid = note.clientId?._id?.toString() || note.clientId?.toString();
      if (!cid) return;
      if (!notesByClient[cid]) notesByClient[cid] = [];
      notesByClient[cid].push(note);
    });

    const clientSummaries = await Promise.all(
      clients.map(async (client) => {
        const cid = client._id.toString();
        const clientNotes = notesByClient[cid] || [];

        const lastNote = clientNotes.length
          ? clientNotes.reduce((a, b) =>
              new Date(a.createdAt) > new Date(b.createdAt) ? a : b
            )
          : null;

        const pendingCount = clientNotes.filter(n => n.status === "Pending").length;
        const flaggedCount = clientNotes.filter(
          n => n.category === "Medication" && n.status === "Pending"
        ).length;

        const highPriority = pendingCount > 2;

        let staffAssigned = 0;
        if (Array.isArray(client.assignedStaff)) staffAssigned = client.assignedStaff.length;
        else if (client.assignedStaff) staffAssigned = 1;

        const code = client.code || ("C" + cid.slice(-3).toUpperCase());

        return {
          _id: client._id,
          name: client.name,
          code,
          lastNote: lastNote
            ? {
                content: lastNote.content,
                createdAt: lastNote.createdAt,
                status: lastNote.status,
                category: lastNote.category
              }
            : null,
          notesCount: clientNotes.length,
          staffAssigned,
          priority: client.priority || "Normal",
          pendingCount,
          flaggedCount,
          highPriority
        };
      })
    );

    res.json({
      totalClients: clientSummaries.length,
      highPriorityCount: clientSummaries.filter(c => c.highPriority).length,
      pendingReviewCount: clientSummaries.filter(c => c.pendingCount > 0).length,
      flaggedCount: clientSummaries.filter(c => c.flaggedCount > 0).length,
      clients: clientSummaries
    });
  } catch (err) {
    res.status(500).json({ message: "Error loading notes summary", error: err.message });
  }
};

/* ======================================================
   SUPERVISOR DASHBOARD
   GET /api/supervisor/dashboard
====================================================== */
exports.getDashboard = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments({ status: "Active" });
    const staffMembers = await User.countDocuments({ role: "staff" });
    const pendingVerifications = await Note.countDocuments({ status: "Pending" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = await Note.countDocuments({
      status: "Approved",
      createdAt: { $gte: today }
    });

    const recentNotes = await Note.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("clientId", "name")
      .populate("staffId", "name");

    const alerts = [];

    const urgentNote = await Note.findOne({
      category: "Medication",
      status: "Pending"
    })
      .populate("clientId", "name")
      .populate("staffId", "name");

    if (urgentNote) {
      alerts.push({
        type: "urgent",
        title: "Urgent Verification Required",
        message: `${urgentNote.staffId?.name || "Staff"} - Flagged note requires immediate supervisor review`,
        time: urgentNote.createdAt,
        level: "Urgent"
      });
    }

    const highPriority = await Note.aggregate([
      { $match: { status: "Pending" } },
      { $group: { _id: "$clientId", count: { $sum: 1 } } },
      { $match: { count: { $gt: 2 } } },
      { $limit: 1 }
    ]);

    if (highPriority.length) {
      const client = await Client.findById(highPriority[0]._id);
      alerts.push({
        type: "warning",
        title: "High Priority Client",
        message: `${client?.name || "Client"} - ${highPriority[0].count} pending notes awaiting verification`,
        time: new Date(),
        level: "Warning"
      });
    }

    const nextShift = await Shift.findOne({ date: { $gte: new Date() } }).sort({ date: 1 });
    if (nextShift) {
      alerts.push({
        type: "info",
        title: "Shift Update",
        message: `Evening shift (${nextShift.startTime} - ${nextShift.endTime}) starting soon`,
        time: new Date(),
        level: "Info"
      });
    }

    res.json({
      totalClients,
      staffMembers,
      pendingVerifications,
      completedToday,
      recentNotes,
      alerts
    });
  } catch (err) {
    res.status(500).json({ message: "Error loading dashboard", error: err.message });
  }
};

/* ======================================================
   GET ALL NOTES
   GET /api/supervisor/notes
====================================================== */
exports.getAllNotes = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const notes = await Note.find(filter)
      .populate("staffId", "name")
      .populate("clientId", "name");

    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching notes" });
  }
};

/* ======================================================
   VERIFY NOTE
   PATCH /api/supervisor/notes/:noteId
====================================================== */
exports.verifyNote = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const note = await Note.findByIdAndUpdate(
      req.params.noteId,
      { status },
      { new: true }
    );

    if (!note) return res.status(404).json({ message: "Note not found" });

    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Error updating note status" });
  }
};

/* ======================================================
   STAFF–CLIENT ASSIGNMENTS
   GET /api/supervisor/assignments
====================================================== */
exports.getStaffClientAssignments = async (req, res) => {
  try {
    const clients = await Client.find().populate(
      "assignedStaff",
      "_id name startTime endTime assignmentStart daysPerWeek status"
    );

    const notes = await Note.find();

    const standardSlots = [
      { label: "Shift 1 (00:00-08:00)", start: "00:00" },
      { label: "Shift 2 (08:00-16:00)", start: "08:00" },
      { label: "Shift 3 (16:00-00:00)", start: "16:00" }
    ];

    const findSlotLabel = (startTime) => {
      if (!startTime) return "";
      const hour = parseInt(startTime.split(":")[0], 10);
      if (hour < 8) return standardSlots[0].label;
      if (hour < 16) return standardSlots[1].label;
      return standardSlots[2].label;
    };

    const assignments = [];

    for (const client of clients) {
      for (const staff of client.assignedStaff || []) {
        const shift = await Shift.findOne({
          staff: staff._id,
          client: client._id,
          status: "active"
        });

        const startTime = shift?.startTime || staff.startTime || "";
        const endTime = shift?.endTime || staff.endTime || "";
        const assignmentStart = shift?.assignmentStart || staff.assignmentStart;

        const shiftDate = assignmentStart
          ? new Date(assignmentStart).toISOString().slice(0, 10)
          : "";

        const notesCount = notes.filter(n =>
          n.staffId?.toString() === staff._id.toString() &&
          n.clientId?.toString() === client._id.toString()
        ).length;

        assignments.push({
          staffId: staff._id,
          staffName: staff.name,
          clientId: client._id,
          clientName: client.name,
          shiftDate,
          shiftTime: `${startTime} - ${endTime}`,
          slotLabel: findSlotLabel(startTime),
          daysPerWeek: staff.daysPerWeek,
          status: shift?.status || "Active",
          notesCount
        });
      }
    }

    res.json(assignments);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching staff-client assignments",
      error: err.message
    });
  }
};
