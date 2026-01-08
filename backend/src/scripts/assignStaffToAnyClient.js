// Moved from backend root to src/scripts
require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('../models/Client');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function assignStaffToAnyClient(staffEmail, clientId) {
  try {
    await mongoose.connect(MONGO_URI);
    const staff = await User.findOne({ email: staffEmail, role: 'staff' });
    if (!staff) throw new Error('No staff user found with that email');
    const client = await Client.findById(clientId);
    if (!client) throw new Error('No client found with that ID');
    if (!client.assignedStaff) client.assignedStaff = [];
    if (!client.assignedStaff.includes(staff._id)) client.assignedStaff.push(staff._id);
      await client.save();
      // Add client to staff's assignedClients if not already present and max 3 not exceeded
      if (!staff.assignedClients.map(id => id.toString()).includes(client._id.toString())) {
        if (staff.assignedClients.length < 3) {
          staff.assignedClients.push(client._id);
          await staff.save();
        } else {
          console.log(`❌ Staff already has 3 assigned clients.`);
        }
      }
      console.log(`✅ Assigned staff ${staff.email} to client ${client.name}`);
    } else {
      console.log(`ℹ️ Staff ${staff.email} is already assigned to client ${client.name}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error assigning staff to client:', err);
    process.exit(1);
  }
}

const [,, staffEmail, clientId] = process.argv;
if (!staffEmail || !clientId) {
  console.error('Usage: node assignStaffToAnyClient.js <staffEmail> <clientId>');
  process.exit(1);
}
assignStaffToAnyClient(staffEmail, clientId);
