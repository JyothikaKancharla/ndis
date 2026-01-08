const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["staff", "supervisor"], required: true },
  assignedClients: [{ type: mongoose.Schema.Types.ObjectId, ref: "Client", maxItems: 3 }],
  shiftPattern: { type: String },
  startTime: { type: String },
  endTime: { type: String },
  assignmentStart: { type: Date },
  daysPerWeek: { type: Number }
});

module.exports = mongoose.model("User", userSchema);
