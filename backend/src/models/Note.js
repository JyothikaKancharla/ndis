const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift" },
  text: String,
  emotion: String,
  verified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Note", noteSchema);
