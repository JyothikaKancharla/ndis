const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/staff.controller");

router.post("/notes", auth(["staff"]), controller.createNote);
router.get("/notes", auth(["staff"]), controller.getMyNotes);

module.exports = router;
