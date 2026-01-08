const router = require("express").Router();
const { login, signup } = require("../controllers/auth.controller");

// Public auth routes
router.post("/login", login);
router.post("/signup", signup);
// Alias/register route to match requested API
router.post("/register", signup);

module.exports = router;
