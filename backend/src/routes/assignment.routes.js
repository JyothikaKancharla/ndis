const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const controller = require("../controllers/assignment.controller");

// Only supervisors can create/update
router.post("/", authenticate, authorize("supervisor"), controller.createAssignment);
router.put("/:id", authenticate, authorize("supervisor"), controller.updateAssignment);

// Staff can view their assignments (route guarded by auth to ensure the staffId matches the token for extra safety)
router.get("/staff/:staffId", authenticate, authorize("staff", "supervisor"), async (req, res, next) => {
  // allow supervisors to query any staff; staff can query only their own id
  if (req.user.role === "staff" && req.user.id !== req.params.staffId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return controller.getStaffAssignments(req, res, next);
});

// Supervisor view
router.get("/supervisor/:supervisorId", authenticate, authorize("supervisor"), controller.getSupervisorAssignments);

module.exports = router;
