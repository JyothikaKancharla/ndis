require('dotenv').config();
const mongoose = require('mongoose');
const Client = require('../models/Client');
const Note = require('../models/Note');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ndis';

async function seedTestData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing clients and notes
    await Client.deleteMany({});
    await Note.deleteMany({});
    console.log('🧹 Cleared existing clients and notes');

    // Create test clients
    const clientData = [
      { name: 'James Wilson', ndisNumber: 'NDIS001', careLevel: 'High', isActive: true },
      { name: 'Margaret Thompson', ndisNumber: 'NDIS002', careLevel: 'Medium', isActive: true },
      { name: 'Robert Anderson', ndisNumber: 'NDIS003', careLevel: 'Low', isActive: true },
      { name: 'Patricia Johnson', ndisNumber: 'NDIS004', careLevel: 'High', isActive: true },
      { name: 'Michael Davis', ndisNumber: 'NDIS005', careLevel: 'Medium', isActive: true }
    ];

    const clients = await Client.insertMany(clientData);
    console.log(`✅ Created ${clients.length} clients`);

    // Get first staff member from database
    const staff = await User.find({ role: 'staff', isActive: true }).limit(3);
    
    if (staff.length === 0) {
      console.log('⚠️  No staff found in database. Please create staff first.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`✅ Found ${staff.length} staff members`);

    // Create test notes
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const noteData = [
      {
        staffId: staff[0]._id,
        clientId: clients[0]._id,
        category: 'Daily Activity',
        shift: '6:00 AM - 2:00 PM',
        shiftDate: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)),
        status: 'Pending',
        content: 'Test note 1 - Pending',
        isLocked: false
      },
      {
        staffId: staff[1]._id,
        clientId: clients[1]._id,
        category: 'Vital Signs',
        shift: '2:00 PM - 10:00 PM',
        shiftDate: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)),
        status: 'Approved',
        content: 'Test note 2 - Verified',
        isLocked: false
      },
      {
        staffId: staff[2]._id,
        clientId: clients[2]._id,
        category: 'Medication',
        shift: '10:00 PM - 6:00 AM',
        shiftDate: new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)),
        status: 'Pending',
        content: 'Test note 3 - Pending',
        isLocked: false
      }
    ];

    const notes = await Note.insertMany(noteData);
    console.log(`✅ Created ${notes.length} test notes`);

    console.log('\n📊 Summary:');
    console.log(`   Clients: ${clients.length}`);
    console.log(`   Staff Found: ${staff.length}`);
    console.log(`   Clients: ${clients.length}`);
    console.log(`   Total Notes: ${notes.length}`);
    console.log(`   Pending Notes: 2`);
    console.log(`   Verified Notes: 1`);

    await mongoose.disconnect();
    console.log('\n✅ Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding data:', err.message);
    process.exit(1);
  }
}

seedTestData();
