const mongoose = require('mongoose');
const { RATE_TYPES } = require('../constants');

const assignmentSchema = new mongoose.Schema({
  staffId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },
  
  // NDIS Shift Configuration
  shift: { 
    type: String, 
    required: true 
  },
  
  // Rate type for billing
  rateType: {
    type: String,
    enum: RATE_TYPES,
    default: 'Standard'
  },
  
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: Date,
  status: {
    type: String,
    enum: ['Pending', 'Current', 'Completed', 'Previous'],
    default: 'Pending'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isRecurring: { 
    type: Boolean, 
    default: false 
  },
  recurringDays: [
    { 
      type: String, 
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] 
    }
  ],
  
  daysPerWeek: {
    type: Number,
    default: 5,
    min: 1,
    max: 7
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Shift History Fields
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: Date,
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unlockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unlockedAt: Date,
  completedAt: Date,
  shiftNotes: {
    type: String,
    maxlength: 2000,
    default: ''
  },
  startOdometer: { type: Number, min: 0, default: null },
  endOdometer: { type: Number, min: 0, default: null },
  totalDistance: { type: Number, min: 0, default: null },
  odometerStatus: { type: String, enum: ['pending', 'approved', 'flagged', null], default: null }
}, { timestamps: true });

// Prevent duplicate assignments
assignmentSchema.index(
  { staffId: 1, clientId: 1, shift: 1, startDate: 1 }, 
  { unique: true }
);

// Auto-lock and stamp completedAt when status transitions to Previous
assignmentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Previous') {
    if (!this.isLocked) {
      this.isLocked = true;
      this.lockedAt = new Date();
    }
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('Assignment', assignmentSchema);
