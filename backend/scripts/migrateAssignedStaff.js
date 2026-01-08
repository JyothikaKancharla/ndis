// Script to migrate all Client documents to use assignedStaff (array) instead of assignedStaffId (single)
// Run this with: node scripts/migrateAssignedStaff.js

const mongoose = require('mongoose');
const Client = require('../src/models/Client');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ndis';

async function migrate() {
  await mongoose.connect(MONGO_URI);
  const clients = await Client.find({});
  let updated = 0;
  for (const client of clients) {
    let changed = false;
    // If assignedStaffId exists, move it to assignedStaff array
    if (client.assignedStaffId) {
      if (!client.assignedStaff) client.assignedStaff = [];
      if (!client.assignedStaff.includes(client.assignedStaffId)) {
        client.assignedStaff.push(client.assignedStaffId);
        changed = true;
      }
      client.assignedStaffId = undefined;
      changed = true;
    }
    // If assignedStaff is missing, add empty array
    if (!client.assignedStaff) {
      client.assignedStaff = [];
      changed = true;
    }
    if (changed) {
      await client.save();
      updated++;
    }
  }
  console.log(`Migration complete. Updated ${updated} clients.`);
  await mongoose.disconnect();
}

migrate().catch(e => { console.error(e); process.exit(1); });
