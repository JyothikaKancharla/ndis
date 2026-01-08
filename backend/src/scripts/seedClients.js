// Moved from backend root to src/scripts
require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('../models/Client');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function seedClients() {
  try {
    await mongoose.connect(MONGO_URI);
    // Add your seeding logic here
    console.log('✅ Clients seeded');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding clients:', err);
    process.exit(1);
  }
}

seedClients();
