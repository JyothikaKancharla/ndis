const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  appointmentDate: {
    type: Date,
    required: true,
    index: true
  },
  startTime: {
    type: String,
    required: true // Format: "HH:MM AM/PM" e.g., "9:00 AM"
  },
  endTime: {
    type: String // Optional end time
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled',
    index: true
  },
  location: {
    type: String,
    maxlength: 200,
    trim: true
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  cancellationReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Compound indexes for efficient queries
appointmentSchema.index({ staffId: 1, appointmentDate: -1 });
appointmentSchema.index({ clientId: 1, appointmentDate: -1 });
appointmentSchema.index({ supervisorId: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 }); // For querying upcoming appointments

module.exports = mongoose.model('Appointment', appointmentSchema);
