require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Shift = require('../models/Shift');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function createShiftsFromStaff() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');
  try {
    const staffUsers = await User.find({ role: 'staff' });
    console.log(`Found ${staffUsers.length} staff users`);
    let created = 0;
    for (const u of staffUsers) {
      const hasShiftInfo = u.startTime || u.endTime || u.assignmentStart;
      if (!hasShiftInfo) continue;
      const existing = await Shift.findOne({ staff: u._id, status: 'active' });
      if (existing) continue;
      const date = u.assignmentStart || new Date();
      const shift = new Shift({
        staff: u._id,
        startTime: u.startTime || '',
        endTime: u.endTime || '',
        date,
        status: 'active'
      });
      await shift.save();
      created++;
      console.log(`Created shift for ${u.name} (${u._id}) on ${date}`);
    }
    console.log(`Done. Created ${created} shift(s).`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.connection.close();
  }
}

createShiftsFromStaff();
