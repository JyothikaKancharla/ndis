const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Action details
  action: {
    type: String,
    enum: [
      'note:created',
      'note:updated',
      'note:locked',
      'note:verified',
      'note:rejected',
      'note:unlocked',
      'assignment:created',
      'assignment:updated',
      'assignment:deleted',
      'trip:created',
      'trip:verified',
      'trip:rejected',
      'user:login',
      'user:logout',
      'system:config'
    ],
    required: true,
    index: true
  },

  // Performer
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  performedByName: String, // Snapshot of user name for reference
  performedByRole: String, // Snapshot of user role for reference

  // Resource affected
  resourceType: {
    type: String,
    enum: ['Note', 'Assignment', 'Trip', 'User', 'Client'],
    required: true,
    index: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  // Related entities
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },

  // Shift information (NDIS requirement)
  shift: String, // The shift during which action occurred
  shiftDate: Date, // Date of relevant shift

  // Changes made
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema Types.Mixed
  },

  // Status
  status: {
    type: String,
    enum: ['success', 'failure', 'attempted'],
    default: 'success'
  },

  // Details
  details: {
    type: String,
    maxlength: 1000
  },

  // Request metadata
  ipAddress: String,
  userAgent: String,

  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }

}, { timestamps: false });

// Indexes for audit queries
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ clientId: 1, timestamp: -1 });
auditLogSchema.index({ shift: 1, shiftDate: -1 });

// Prevent deletion or modification (immutable)
auditLogSchema.pre('updateOne', function(next) {
  const err = new Error('Audit logs are immutable and cannot be modified');
  err.statusCode = 403;
  next(err);
});

auditLogSchema.pre('findByIdAndUpdate', function(next) {
  const err = new Error('Audit logs are immutable and cannot be modified');
  err.statusCode = 403;
  next(err);
});

auditLogSchema.pre('deleteOne', function(next) {
  const err = new Error('Audit logs are immutable and cannot be deleted');
  err.statusCode = 403;
  next(err);
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
