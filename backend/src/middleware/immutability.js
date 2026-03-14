/**
 * Immutability Middleware
 * Prevents modification or deletion of approved or locked records
 * Required for NDIS compliance - records must be immutable after approval
 */

const checkNoteImmutability = (Note) => {
  return async (req, res, next) => {
    try {
      const noteId = req.params?.id;
      if (!noteId || req.method === 'GET') return next();

      const note = await Note.findById(noteId);
      if (!note) return next(); // Let controller handle not found

      // Check if note is locked (submitted for review)
      if (note.isLocked) {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify a locked note. Only supervisors can unlock it.',
          errorCode: 'NOTE_LOCKED',
          lockedAt: note.lockedAt
        });
      }

      // Check if note is verified (approved)
      if (note.verifiedBy) {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify an approved note. Contact supervisor to unlock.',
          errorCode: 'NOTE_APPROVED',
          verifiedAt: note.verifiedAt
        });
      }

      // Check if note is rejected - can be edited and resubmitted
      if (note.status === 'Rejected' && req.method === 'DELETE') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete a rejected note. Edit and resubmit instead.',
          errorCode: 'CANNOT_DELETE_REJECTED'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking note immutability',
        error: error.message
      });
    }
  };
};

const checkTripImmutability = (Trip) => {
  return async (req, res, next) => {
    try {
      const tripId = req.params?.id;
      if (!tripId || req.method === 'GET') return next();

      const trip = await Trip.findById(tripId);
      if (!trip) return next(); // Let controller handle not found

      // Check if trip is verified (approved)
      if (trip.status === 'Approved' || trip.reviewedBy) {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify an approved trip. Contact supervisor to make changes.',
          errorCode: 'TRIP_APPROVED',
          approvedAt: trip.reviewedAt
        });
      }

      // Check if trip is rejected - can be edited and resubmitted
      if (trip.status === 'Rejected' && req.method === 'DELETE') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete a rejected trip. Edit and resubmit instead.',
          errorCode: 'CANNOT_DELETE_REJECTED_TRIP'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking trip immutability',
        error: error.message
      });
    }
  };
};

const checkAssignmentImmutability = (Assignment) => {
  return async (req, res, next) => {
    try {
      const assignmentId = req.params?.id;
      if (!assignmentId || req.method === 'GET') return next();

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) return next(); // Let controller handle not found

      // Only supervisors can modify assignments
      const userRole = req.user?.role;
      if (userRole !== 'supervisor') {
        return res.status(403).json({
          success: false,
          message: 'Only supervisors can modify assignments',
          errorCode: 'ASSIGNMENT_ACCESS_DENIED'
        });
      }

      // If assignment has ended, prevent changes
      if (assignment.endDate < new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify a completed assignment. Create a new assignment instead.',
          errorCode: 'ASSIGNMENT_ENDED',
          endDate: assignment.endDate
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking assignment immutability',
        error: error.message
      });
    }
  };
};

/**
 * Enforce immutability on schema level (prevents direct updates in models)
 */
const enforceImmutability = (schema, recordFields = []) => {
  schema.pre('updateOne', function(next) {
    const updates = this.getUpdate();
    const immutableFields = recordFields || ['verifiedAt', 'verifiedBy', 'rejectionReason', 'isLocked', 'lockedAt'];

    for (let field of immutableFields) {
      if (updates[field] !== undefined) {
        const err = new Error(`Field ${field} is immutable once set`);
        err.statusCode = 403;
        return next(err);
      }
    }
    next();
  });

  schema.pre('findByIdAndUpdate', function(next) {
    const updates = this.getUpdate();
    const immutableFields = recordFields || ['verifiedAt', 'verifiedBy', 'rejectionReason', 'isLocked', 'lockedAt'];

    for (let field of immutableFields) {
      if (updates[field] !== undefined) {
        const err = new Error(`Field ${field} is immutable once set`);
        err.statusCode = 403;
        return next(err);
      }
    }
    next();
  });
};

module.exports = {
  checkNoteImmutability,
  checkTripImmutability,
  checkAssignmentImmutability,
  enforceImmutability
};
