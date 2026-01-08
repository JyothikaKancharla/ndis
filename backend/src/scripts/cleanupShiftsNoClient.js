require('dotenv').config();
const mongoose = require('mongoose');
const Shift = require('../models/Shift');

async function main() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  try {
    const r = await Shift.deleteMany({ client: { $exists: false } });
    console.log('deleted', r.deletedCount);
  } catch (err) {
    console.error('Error during cleanup:', err.message || err);
  } finally {
    await mongoose.connection.close();
  }
}

main();
