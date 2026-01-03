const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  name: String,
  assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("Client", clientSchema);
