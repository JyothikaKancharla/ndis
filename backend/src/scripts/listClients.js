// Moved from backend root to src/scripts
require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('../models/Client');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function listClients() {
  try {
    await mongoose.connect(MONGO_URI);
    const clients = await Client.find();
    for (const client of clients) {
      console.log(`Client: ${client._id} | Name: ${client.name} | AssignedStaff: ${client.assignedStaff}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error listing clients:', err);
    process.exit(1);
  }
}

listClients();
