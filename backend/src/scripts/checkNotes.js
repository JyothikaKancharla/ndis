const mongoose = require('mongoose');
const Note = require('../models/Note');
const Client = require('../models/Client');
const User = require('../models/User');
require('dotenv').config();

async function checkNotes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ndis');
    
    const notes = await Note.find().populate('staffId', 'name').populate('clientId', 'name');
    
    console.log('\n📋 CURRENT NOTES IN DATABASE:');
    console.log('========================================');
    
    if (notes.length === 0) {
      console.log('❌ No notes found in database');
    } else {
      notes.forEach((note, index) => {
        console.log(`\nNote ${index + 1}:`);
        console.log(`  Staff: ${note.staffId?.name}`);
        console.log(`  Client: ${note.clientId?.name}`);
        console.log(`  Shift: ${note.shift}`);
        console.log(`  Category: ${note.category}`);
        console.log(`  Status: ${note.status}`);
        console.log(`  Date: ${new Date(note.shiftDate).toLocaleDateString()}`);
        console.log(`  Content: ${note.content.substring(0, 50)}...`);
      });
    }
    
    console.log('\n📊 SHIFT BREAKDOWN:');
    console.log('========================================');
    const shifts = {};
    notes.forEach(note => {
      shifts[note.shift] = (shifts[note.shift] || 0) + 1;
    });
    Object.entries(shifts).forEach(([shift, count]) => {
      console.log(`${shift}: ${count} notes`);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkNotes();
