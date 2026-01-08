// Moved from backend root to src/scripts
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// CHANGE THESE VALUES
const staffEmail = 'abhinayapulagam@gmail.com'; // <-- put your staff email here
const clientId = 'client-a-001'; // <-- put your clientId here (not name)

async function assignStaffToClient() {
  try {
    await mongoose.connect(MONGO_URI);
    const user = await User.findOne({ email: staffEmail });
    if (!user) throw new Error('Staff user not found');
    const client = await Client.findOne({ clientId });
    if (!client) throw new Error('Client not found');
    if (!client.assignedStaff) client.assignedStaff = [];
    if (!client.assignedStaff.includes(user._id)) client.assignedStaff.push(user._id);
    await client.save();
    console.log(`✅ Assigned ${staffEmail} to clientId ${clientId}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

assignStaffToClient();
