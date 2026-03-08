const mongoose = require('mongoose');
const Note = require('../models/Note');
const Client = require('../models/Client');
const User = require('../models/User');
require('dotenv').config();

async function seedNotes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ndis');
    
    // First, create a staff user if it doesn't exist
    let staff = await User.findOne({ role: 'staff' });
    
    if (!staff) {
      console.log('Creating staff user...');
      staff = await User.create({
        name: 'John Care Worker',
        email: 'staff@example.com',
        password: 'hashed_password_123',
        phone: '555-0100',
        role: 'staff',
        isActive: true
      });
      console.log('✅ Staff user created');
    }
    
    // Get first client
    let client = await Client.findOne();
    
    if (!client) {
      console.log('Creating sample client...');
      client = await Client.create({
        name: 'Alice Johnson',
        room: '101',
        careLevel: 'High',
        ndisNumber: 'NDIS-001',
        dateOfBirth: new Date('1980-05-15'),
        isActive: true
      });
      console.log('✅ Sample client created');
    }
    
    // Create sample notes with different shifts
    const sampleNotes = [
      {
        staffId: staff._id,
        clientId: client._id,
        category: 'Daily Activity',
        content: 'Client participated in morning activities. Had breakfast at 7:00 AM, morning walk from 8:00-9:00 AM. Mood was positive.',
        shift: '6:00 AM - 2:00 PM',
        shiftDate: new Date(new Date().setHours(0, 0, 0, 0)),
        status: 'Pending'
      },
      {
        staffId: staff._id,
        clientId: client._id,
        category: 'Medication',
        content: 'Afternoon medications administered on time. Client took all prescribed medications without issue.',
        shift: '2:00 PM - 10:00 PM',
        shiftDate: new Date(new Date().setHours(0, 0, 0, 0)),
        status: 'Approved'
      },
      {
        staffId: staff._id,
        clientId: client._id,
        category: 'Vital Signs',
        content: 'Night shift vital signs monitoring completed. All readings within normal range.',
        shift: '10:00 PM - 6:00 AM',
        shiftDate: new Date(new Date().setHours(0, 0, 0, 0)),
        status: 'Pending'
      },
      {
        staffId: staff._id,
        clientId: client._id,
        category: 'Behaviour',
        content: 'Client showed positive engagement with activities throughout the morning.',
        shift: '6:00 AM - 2:00 PM',
        shiftDate: new Date(new Date().getTime() - 24*60*60*1000),
        status: 'Approved'
      },
      {
        staffId: staff._id,
        clientId: client._id,
        category: 'General',
        content: 'Afternoon shift notes: Client completed all scheduled appointments successfully.',
        shift: '2:00 PM - 10:00 PM',
        shiftDate: new Date(new Date().getTime() - 24*60*60*1000),
        status: 'Pending'
      }
    ];
    
    // Delete existing notes
    await Note.deleteMany({});
    
    // Create notes
    const notes = await Note.insertMany(sampleNotes);
    
    console.log(`✅ Created ${notes.length} sample notes`);
    console.log('\n📋 CREATED NOTES:');
    console.log('========================================');
    
    notes.forEach((note, index) => {
      console.log(`\nNote ${index + 1}:`);
      console.log(`  Shift: ${note.shift}`);
      console.log(`  Status: ${note.status}`);
      console.log(`  Category: ${note.category}`);
      console.log(`  Date: ${new Date(note.shiftDate).toLocaleDateString()}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Database seeded successfully');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedNotes();
