const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client"
    },
    startTime: String,
    endTime: String,
    date: Date,
    assignmentStart: Date,
    daysPerWeek: Number,
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shift", shiftSchema);
