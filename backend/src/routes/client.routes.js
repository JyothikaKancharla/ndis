const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const clientController = require('../controllers/client.controller');

// All routes require supervisor role
router.use(authenticate, authorize('supervisor'));

// IMPORTANT: More specific routes MUST come before generic :clientId route

// Get client shift history
router.get('/:clientId/shifts', clientController.getClientShifts);

// Get client notes history
router.get('/:clientId/notes', clientController.getClientNotes);

// Download PDF report (shift history)
router.get('/:clientId/report', clientController.downloadClientReport);

// Download client summary report (key points from notes)
router.get('/:clientId/summary-report', clientController.downloadClientSummary);

// Get client details with populated data (generic route - MUST be last)
router.get('/:clientId', clientController.getClientDetails);

module.exports = router;
