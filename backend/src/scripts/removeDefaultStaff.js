require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ndis';

async function removeDefaultStaff() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Remove staff with default names
    const defaultNames = [
      'John Smith',
      'Sarah Johnson',
      'Michael Brown',
      'Emily Davis',
      'David Wilson',
      'Test Staff',
      'Staff Member'
    ];

    const result = await User.deleteMany({
      role: 'staff',
      name: { $in: defaultNames }
    });

    console.log(`🧹 Removed ${result.deletedCount} staff with default names`);

    // Get remaining staff
    const staff = await User.find({ role: 'staff', isActive: true });
    console.log(`\n✅ Remaining staff members:`);
    staff.forEach(s => {
      console.log(`   - ${s.name} (${s.email})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Cleanup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

removeDefaultStaff();
