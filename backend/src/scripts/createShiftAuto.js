require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const Shift = require('../models/Shift');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    const staff = await User.findOne({ role: 'staff' });
    const client = await Client.findOne();
    if (!staff) {
      console.log('No staff users found');
      return;
    }
    if (!client) {
      console.log('No clients found');
      return;
    }
    console.log('Using staff:', staff._id.toString(), staff.name);
    console.log('Using client:', client._id.toString(), client.name);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const assignmentStart = new Date(tomorrow.toISOString().slice(0,10));
    const shift = new Shift({
      staff: staff._id,
      client: client._id,
      startTime: '08:00',
      endTime: '16:00',
      date: assignmentStart,
      assignmentStart,
      daysPerWeek: 5,
      status: 'active'
    });
    await shift.save();
    console.log('Created shift', shift._id.toString());
  } catch (err) {
    console.error('Error:', err.message || err);
  } finally {
    await mongoose.connection.close();
  }
}

main();
