require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const Shift = require('../models/Shift');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.log('Usage: node inspectShift.js <shiftId|staffId>');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    // Try find by shift id first
    let shift = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      shift = await Shift.findById(id).populate('staff client');
    }
    if (shift) {
      console.log('Found shift by id:');
      console.log(JSON.stringify(shift, null, 2));
    } else {
      // treat as staff id: list shifts for staff
      const shifts = await Shift.find({ staff: id }).populate('staff client');
      console.log(`Found ${shifts.length} shift(s) for staff ${id}`);
      console.log(JSON.stringify(shifts, null, 2));
      // list clients that include this staff
      const clients = await Client.find({ assignedStaff: id });
      console.log(`Clients with staff ${id} in assignedStaff: ${clients.length}`);
      console.log(JSON.stringify(clients.map(c => ({ _id: c._id, name: c.name, assignedStaff: c.assignedStaff })), null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message || err);
  } finally {
    await mongoose.connection.close();
  }
}

main();
