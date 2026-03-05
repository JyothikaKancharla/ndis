const mongoose = require('mongoose');
const { VALID_SHIFT_TIMES, NOTE_CATEGORIES, NOTE_STATUSES } = require('../constants');
const { enforceImmutability } = require('../middleware/immutability');

const noteSchema = new mongoose.Schema({
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
  category: { 
    type: String, 
    enum: NOTE_CATEGORIES,
    required: true 
  },
  noteType: {
    type: String,
    enum: ['text', 'voice', 'consolidated', 'file'],
    default: 'text'
  },
  // File attachments
  attachments: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  content: {
    type: String,
    required: true
  },

  // Merged document entries (populated when notes are merged on submit)
  entries: [{
    content: { type: String, required: true },
    noteType: { type: String, enum: ['text', 'voice', 'file'], default: 'text' },
    attachments: [{
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      path: String,
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    createdAt: { type: Date, required: true }
  }],

  // NDIS Shift Configuration
  shift: {
    type: String,
    required: true
  },
  shiftDate: { 
    type: Date, 
    required: true 
  },
  
  status: { 
    type: String, 
    enum: NOTE_STATUSES,
    default: 'Draft',
    index: true 
  },
  isLocked: { 
    type: Boolean, 
    default: false 
  },
  lockedAt: Date,
  lockedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // Verification
  verifiedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  verifiedAt: Date,
  rejectionReason: { 
    type: String, 
    maxlength: 500 
  },
  
  // Unlock
  unlockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unlockedAt: Date,
  unlockReason: {
    type: String,
    maxlength: 500
  },

  // Edit history tracking
  editHistory: [{
    editedAt: { type: Date, default: Date.now },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    previousContent: String // First 200 chars of previous content
  }],
  lastEditedAt: Date,

  submittedAt: Date,
  startOdometer: { type: Number, default: null },
  endOdometer: { type: Number, default: null },
  totalDistance: { type: Number, default: null },
  odometerStatus: { type: String, enum: ['pending', 'approved', 'flagged', null], default: null }
}, { timestamps: true });

// Indexes for performance
noteSchema.index({ staffId: 1, shiftDate: -1 });
noteSchema.index({ clientId: 1, shiftDate: -1 });
noteSchema.index({ shift: 1, shiftDate: -1 });
noteSchema.index({ status: 1, staffId: 1 });

// Virtual for formatted date
noteSchema.virtual('formattedDate').get(function() {
  return this.shiftDate.toISOString().split('T')[0];
});

// Pre-save: Set submittedAt when status changes to Pending or Submitted
noteSchema.pre('save', function(next) {
  if (this.isModified('status') && (this.status === 'Pending' || this.status === 'Submitted') && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  next();
});

// Immutability enforcement - prevent modification of locked/verified notes
noteSchema.pre('updateOne', function(next) {
  const updates = this.getUpdate();
  
  // Cannot modify approved/verified notes
  if (updates.verifiedBy || updates.verifiedAt || updates.$set?.verifiedBy) {
    // Allow supervisors to unlock verified notes
    if (!updates.unlockedBy && !updates.unlockedAt) {
      const err = new Error('Cannot modify an approved note. Unlock it first.');
      err.statusCode = 403;
      return next(err);
    }
  }
  
  next();
});

noteSchema.pre('findByIdAndUpdate', function(next) {
  const updates = this.getUpdate();
  
  // Cannot modify approved/verified notes (unless unlocking)
  if ((updates.verifiedBy || updates.verifiedAt || updates.$set?.verifiedBy)) {
    if (!updates.unlockedBy && !updates.unlockedAt && !updates.$set?.unlockedBy) {
      const err = new Error('Cannot modify an approved note. Unlock it first.');
      err.statusCode = 403;
      return next(err);
    }
  }
  
  next();
});

module.exports = mongoose.model('Note', noteSchema);
