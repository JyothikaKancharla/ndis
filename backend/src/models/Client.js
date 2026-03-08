const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  ndisNumber: { 
    type: String, 
    unique: true,
    sparse: true
  },
  dateOfBirth: Date,
  room: String,
  careLevel: { 
    type: String, 
    enum: ['High', 'Medium', 'Low'], 
    default: 'Medium' 
  },
  address: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
