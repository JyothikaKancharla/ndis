// Moved from backend root to src/scripts
require('dotenv').config();
const mongoose = require('mongoose');
const Note = require('../models/Note');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function listNotes(clientId, staffEmail) {
  try {
    await mongoose.connect(MONGO_URI);
    const staff = await User.findOne({ email: staffEmail });
    if (!staff) throw new Error('No staff user found');
    const notes = await Note.find({ clientId, staffId: staff._id });
    if (notes.length === 0) {
      console.log('No notes found for this client and staff.');
    } else {
      for (const note of notes) {
        console.log(`Note: ${note._id} | Content: ${note.content} | Category: ${note.category} | Created: ${note.createdAt}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error listing notes:', err);
    process.exit(1);
  }
}

const [,, clientId, staffEmail] = process.argv;
if (!clientId || !staffEmail) {
  console.error('Usage: node listNotes.js <clientId> <staffEmail>');
  process.exit(1);
}
listNotes(clientId, staffEmail);
