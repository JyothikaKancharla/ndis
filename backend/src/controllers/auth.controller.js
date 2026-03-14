
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Find user by email only; role is persisted in the DB
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: user not found for', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: password mismatch for user', user._id.toString());
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { 
        _id: user._id, 
        id: user._id,
        role: user.role, 
        name: user.name,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive !== false // Default to true if not set
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Return token and basic user info (including role from DB)
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePic: user.profilePic }
    });
  } catch (err) {
    console.error('Auth login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Signup controller for all roles
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, profilePic } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Only allow valid roles
    if (!["supervisor", "staff"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new user (do not store gender/age)
    const user = new User({ name, email, password: hashedPassword, role, profilePic });
    await user.save();

    res.status(201).json({ message: "Signup successful", user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Auth signup error:', err);
    res.status(500).json({ message: "Server error" });
  }
};
