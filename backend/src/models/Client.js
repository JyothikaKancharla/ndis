const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    priority: {
      type: String,
      enum: ["High", "Medium", "Normal", "Other"],
      default: "Normal",
    },

    dob: String,
    gender: String,
    phone: String,
    email: String,
    address: String,
    carePlan: String,

    careLevel: {
      type: String,
      enum: ["Low", "Medium", "High"], // restrict values
      default: "Low" // default value
    },

    medicalNotes: String,
    status: { type: String, default: "Active" },

    emergencyContact: {
      name: String,
      phone: String,
    },

    assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", ClientSchema);
