const mongoose = require('mongoose');
const { VALID_SHIFT_TIMES, TRIP_PURPOSES, TRIP_STATUSES } = require('../constants');

const tripSchema = new mongoose.Schema({
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
  
  tripDate: { 
    type: Date, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: { 
    type: String, 
    required: true 
  },
  
  // Link to shift (optional - trip may occur during a shift)
  relatedShift: { 
    type: String, 
    enum: [...VALID_SHIFT_TIMES, null],
    default: null
  },
  
  purpose: { 
    type: String, 
    enum: TRIP_PURPOSES,
    required: true 
  },
  startOdometer: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  endOdometer: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  totalDistance: { 
    type: Number, 
    required: true 
  },
  
  status: { 
    type: String, 
    enum: TRIP_STATUSES,
    default: 'Pending',
    index: true 
  },
  staffNotes: { type: String, maxlength: 500 },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reviewedAt: Date,
  supervisorNotes: String,
  rejectionReason: String,
  submittedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Pre-save validation
tripSchema.pre('save', function(next) {
  if (this.endOdometer <= this.startOdometer) {
    return next(new Error('End odometer must be greater than start odometer'));
  }
  this.totalDistance = this.endOdometer - this.startOdometer;
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
