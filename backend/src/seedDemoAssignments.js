// Seed demo data for Staff-Client Assignments UI
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
const Shift = require('./models/Shift');
const Note = require('./models/Note');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function seedDemoAssignments() {
  await mongoose.connect(MONGO_URI);

  // 1. Create staff users
  const staff1 = await User.create({ name: 'John Smith', email: 'john@example.com', password: 'test123', role: 'staff' });
  const staff2 = await User.create({ name: 'Emma Davis', email: 'emma@example.com', password: 'test123', role: 'staff' });

  // 2. Create clients
  const client1 = await Client.create({ name: 'Patricia Taylor', status: 'Active', assignedStaff: [staff1._id] });
  const client2 = await Client.create({ name: 'James Anderson', status: 'Active', assignedStaff: [staff2._id] });

  // 3. Create shifts
  const today = new Date();
  const shift1 = await Shift.create({ staff: staff1._id, startTime: '08:00 AM', endTime: '04:00 PM', date: today, status: 'active' });
  const shift2 = await Shift.create({ staff: staff2._id, startTime: '04:00 PM', endTime: '12:00 AM', date: today, status: 'active' });

  // 4. Create notes
  await Note.create({ clientId: client1._id, staffId: staff1._id, shiftId: shift1._id, content: 'Assisted with morning routine.', category: 'Bathing', status: 'Approved' });
  await Note.create({ clientId: client2._id, staffId: staff2._id, shiftId: shift2._id, content: 'Administered medication.', category: 'Medication', status: 'Pending' });

  console.log('Demo assignments, staff, clients, shifts, and notes seeded!');
  process.exit(0);
}

seedDemoAssignments().catch(err => { console.error(err); process.exit(1); });
