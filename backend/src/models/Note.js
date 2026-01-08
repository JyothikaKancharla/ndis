const mongoose = require("mongoose");


const noteSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift", required: false },
  content: { type: String, required: true },
  category: { type: String, enum: [
    "Bathing",
    "Medication",
    "Eating",
    "Emotional State",
    "Movement/Mobility",
    "General Observation"
  ], default: "General Observation" },
  noteType: { type: String, enum: ["text", "voice"], default: "text" },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  draft: { type: Boolean, default: false }
});

module.exports = mongoose.model("Note", noteSchema);
