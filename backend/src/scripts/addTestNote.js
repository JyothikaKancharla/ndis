// Moved from backend root to src/scripts
require('dotenv').config();
const mongoose = require('mongoose');
const Note = require('../models/Note');
const User = require('../models/User');
const Client = require('../models/Client');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function addTestNote(clientId, staffEmail) {
  try {
    await mongoose.connect(MONGO_URI);
    const staff = await User.findOne({ email: staffEmail });
    if (!staff) throw new Error('No staff user found');
    const client = await Client.findById(clientId);
    if (!client) throw new Error('No client found');
    const note = new Note({
      clientId: client._id,
      staffId: staff._id,
      content: 'Test note from script',
      category: 'General Observation',
      status: 'Pending',
      draft: false
    });
    await note.save();
    console.log('✅ Test note added:', note);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error adding note:', err);
    process.exit(1);
  }
}

const [,, clientId, staffEmail] = process.argv;
if (!clientId || !staffEmail) {
  console.error('Usage: node addTestNote.js <clientId> <staffEmail>');
  process.exit(1);
}
addTestNote(clientId, staffEmail);
