// Get assigned staff for a client with detailed info (for /api/supervisor/clients/:clientId/assigned-staff)
const Client = require("../models/Client");
const User = require("../models/User");

exports.getAssignedStaffForClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId).populate("assignedStaff");
    if (!client) return res.status(404).json({ message: "Client not found" });
    // Map staff to include extra fields for frontend
    const Shift = require('../models/Shift');
    const staffList = [];
    for (const staff of (client.assignedStaff || [])) {
      // Try to find a Shift for this staff tied to the client
      const shift = await Shift.findOne({ staff: staff._id, client: client._id, status: 'active' });
      staffList.push({
        _id: staff._id,
        name: staff.name,
        role: staff.role,
        status: shift?.status || 'Active',
        staffCode: staff.code || staff._id.toString().slice(-4).toUpperCase(),
        startTime: shift?.startTime || staff.startTime || "",
        endTime: shift?.endTime || staff.endTime || "",
        assignmentStart: shift?.assignmentStart || staff.assignmentStart || "",
        daysPerWeek: shift?.daysPerWeek || staff.daysPerWeek || "",
        specializations: staff.specializations || [],
        phone: staff.phone || "-"
      });
    }
    res.json(staffList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assigned staff' });
  }
};
