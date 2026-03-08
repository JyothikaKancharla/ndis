require('dotenv').config();
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ndis';

async function removeDefaultAssignments() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Remove all assignments
    const result = await Assignment.deleteMany({});

    console.log(`🧹 Removed ${result.deletedCount} assignments`);

    // Get remaining assignments
    const assignments = await Assignment.find({});
    console.log(`\n✅ Remaining assignments: ${assignments.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Cleanup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

removeDefaultAssignments();
