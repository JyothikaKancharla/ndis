const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/supervisor.controller");

router.get("/clients/:clientId/notes", auth(["supervisor"]), controller.getClientNotes);
router.put("/notes/:noteId/verify", auth(["supervisor"]), controller.verifyNote);

module.exports = router;
