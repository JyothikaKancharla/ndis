require('dotenv').config();
const mongoose = require('mongoose');
const Shift = require('../models/Shift');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node createShiftForClient.js <staffId> <clientId> <date> [startTime] [endTime] [daysPerWeek]');
    console.log('Example: node createShiftForClient.js 64a... 64b... 2026-01-10 "08:00" "16:00" 5');
    process.exit(1);
  }
  const [staff, client, date, startTime = '', endTime = '', daysPerWeek = ''] = args;
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    const assignmentStart = date ? new Date(date) : new Date();
    const shift = new Shift({
      staff,
      client,
      startTime,
      endTime,
      date: assignmentStart,
      assignmentStart,
      daysPerWeek: daysPerWeek ? Number(daysPerWeek) : undefined,
      status: 'active'
    });
    await shift.save();
    console.log('Created Shift:', shift._id.toString());
  } catch (err) {
    console.error('Error creating shift:', err.message || err);
  } finally {
    await mongoose.connection.close();
  }
}

main();
