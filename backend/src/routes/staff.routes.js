const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { getNoteById } = require("../controllers/staff.controller");
// Get a note by its ID (for staff)
router.get("/notes/:noteId", auth(["staff"]), getNoteById);
const {
  getDashboard,
  getStaffById,
  getClientsByStaffId,
  getShiftsByStaffId,
  updateProfile,
  getNotesByClient,
  createNoteForClient,
  editNote,
  getShiftsOverviewForStaff
} = require("../controllers/staff.controller");

// Shifts overview for staff dashboard UI
router.get("/:id/shifts/overview", auth(), getShiftsOverviewForStaff);

// Dashboard for authenticated user
router.get("/dashboard", auth(), getDashboard);

// Notes APIs
router.get("/clients/:clientId/notes", auth(["staff"]), getNotesByClient);
router.post("/clients/:clientId/notes", auth(["staff"]), createNoteForClient);
router.put("/notes/:noteId", auth(["staff"]), editNote);
// Finalize note (set to Pending Review)
const { finalizeNote } = require("../controllers/staff.controller");
router.put("/notes/:noteId/finalize", auth(["staff"]), finalizeNote);


// Staff resource endpoints
router.get("/:id", auth(), getStaffById);
router.get("/:id/clients", auth(), getClientsByStaffId);
router.get("/:id/shifts", auth(), getShiftsByStaffId);
router.put("/:id/profile", auth(), updateProfile);

// Get a single assigned client by clientId (for staff)
const { getAssignedClientById } = require("../controllers/staff.controller");
router.get("/clients/:clientId", auth(["staff"]), getAssignedClientById);

module.exports = router;
