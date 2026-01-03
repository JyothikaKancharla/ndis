const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  startTime: Date,
  endTime: Date
});

module.exports = mongoose.model("Shift", shiftSchema);
