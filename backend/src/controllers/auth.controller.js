
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  // Find user by email and role
  const user = await User.findOne({ email, role });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  // Only allow login for correct role
  if (
    (role === "government" && user.role !== "government") ||
    (role === "supervisor" && user.role !== "supervisor") ||
    (role === "staff" && user.role !== "staff")
  ) {
    return res.status(403).json({ message: "Role not authorized" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ token, role: user.role });
};

// Signup controller for all roles
exports.signup = async (req, res) => {
  try {
    const { name, email, gender, age, password, role } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Only allow valid roles
    if (!["government", "supervisor", "staff"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new user
    const user = new User({ name, email, gender, age, password: hashedPassword, role });
    await user.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
