const mongoose = require('mongoose');
const Note = require('../models/Note');
const Client = require('../models/Client');
const User = require('../models/User');
require('dotenv').config();

async function seedNotesForAllClients() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ndis');
    
    // Get all clients
    const clients = await Client.find().lean();
    const staff = await User.findOne({ role: 'staff' });
    
    if (clients.length === 0) {
      console.log('❌ No clients found');
      process.exit(1);
    }
    
    if (!staff) {
      console.log('❌ No staff found');
      process.exit(1);
    }
    
    // Clear existing notes
    await Note.deleteMany({});
    
    // Create notes for each client with different shifts
    const notesToCreate = [];
    const shiftRotation = ['6:00 AM - 2:00 PM', '2:00 PM - 10:00 PM', '10:00 PM - 6:00 AM'];
    const categories = ['Daily Activity', 'Medication', 'Vital Signs', 'Behaviour', 'General'];
    
    clients.forEach((client, clientIndex) => {
      // Create 3 notes per client (one for each shift)
      for (let i = 0; i < 3; i++) {
        notesToCreate.push({
          staffId: staff._id,
          clientId: client._id,
          category: categories[i % categories.length],
          content: `${categories[i % categories.length]} note for ${client.name} during ${shiftRotation[i]} shift.`,
          shift: shiftRotation[i],
          shiftDate: new Date(new Date().getTime() - (i * 24 * 60 * 60 * 1000)),
          status: i % 2 === 0 ? 'Pending' : 'Approved'
        });
      }
    });
    
    // Insert all notes
    const notes = await Note.insertMany(notesToCreate);
    
    console.log(`✅ Created ${notes.length} notes for ${clients.length} clients`);
    console.log('\n📊 NOTES CREATED:');
    console.log('========================================');
    
    // Count notes by shift
    const shiftBreakdown = {};
    notes.forEach(note => {
      shiftBreakdown[note.shift] = (shiftBreakdown[note.shift] || 0) + 1;
    });
    
    Object.entries(shiftBreakdown).forEach(([shift, count]) => {
      console.log(`${shift}: ${count} notes`);
    });
    
    console.log(`\nTotal clients: ${clients.length}`);
    console.log(`Total notes: ${notes.length}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Database seeded successfully');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedNotesForAllClients();
