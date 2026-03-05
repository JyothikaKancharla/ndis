
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const app = express();

// Connect to MongoDB (once per cold start)
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/shifts", require("./routes/shifts.routes"));
app.use("/api/supervisor", require("./routes/supervisor.routes"));
app.use("/api/staff", require("./routes/staff.routes"));
app.use("/api/assignments", require("./routes/assignment.routes"));
app.use("/api/shift-history", require("./routes/shiftHistory.routes"));
app.use("/api/clients", require("./routes/client.routes"));
app.use("/api", require("./routes/noteAnalysis.routes"));

// Root & health check endpoints
app.get("/", (req, res) => {
  res.json({ success: true, message: "NDIS API is running. Use /api/* endpoints." });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files per upload.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field in file upload.'
      });
    }
  }

  // Handle custom file type errors
  if (err.message && err.message.startsWith('Invalid file type:')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found"
  });
});

module.exports = app;
