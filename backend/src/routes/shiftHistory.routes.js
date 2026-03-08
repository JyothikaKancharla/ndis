const express = require('express');
const router = express.Router();
const shiftHistoryController = require('../controllers/shiftHistory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Both staff and supervisors can view shift history
router.get('/', authenticate, authorize('staff', 'supervisor'), shiftHistoryController.getShiftHistory);

// Export shift history to Excel
router.get('/export', authenticate, authorize('staff', 'supervisor'), shiftHistoryController.exportShiftHistoryExcel);

// Only supervisors can unlock/lock/edit shift records
router.put('/:id/unlock', authenticate, authorize('supervisor'), shiftHistoryController.unlockShift);
router.put('/:id/lock', authenticate, authorize('supervisor'), shiftHistoryController.lockShift);
router.put('/:id/notes', authenticate, authorize('supervisor'), shiftHistoryController.updateShiftNotes);
router.delete('/:id', authenticate, authorize('staff', 'supervisor'), shiftHistoryController.deleteShift);

module.exports = router;
