// Assign existing staff to client and create a shift for assignments UI
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
const Shift = require('./models/Shift');
const Note = require('./models/Note');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function assignExistingStaffAndClient() {
  await mongoose.connect(MONGO_URI);

  // Find any staff and client
  const staff = await User.findOne({ role: 'staff' });
  const client = await Client.findOne();
  if (!staff || !client) {
    console.log('No staff or client found.');
    process.exit(1);
  }

  // Assign staff to client if not already assigned
  if (!client.assignedStaff.map(id => id.toString()).includes(staff._id.toString())) {
    client.assignedStaff.push(staff._id);
    await client.save();
    console.log(`Assigned staff ${staff.name} to client ${client.name}`);
  }

  // Create a shift for this staff
  const today = new Date();
  const shift = await Shift.create({ staff: staff._id, startTime: '08:00 AM', endTime: '04:00 PM', date: today, status: 'active' });
  console.log(`Created shift for staff ${staff.name}`);

  // Create a note for this staff-client-shift
  await Note.create({ clientId: client._id, staffId: staff._id, shiftId: shift._id, content: 'Assisted with care.', category: 'Bathing', status: 'Approved' });
  console.log('Created note for staff-client-shift.');

  console.log('Done. Refresh your assignments page.');
  process.exit(0);
}

assignExistingStaffAndClient().catch(err => { console.error(err); process.exit(1); });
