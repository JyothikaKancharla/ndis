const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const noteAnalysisController = require('../controllers/noteAnalysis.controller');

// Analyze note for risks and sentiment
router.post('/notes/:noteId/analyze',
  authenticate,
  authorize('staff', 'supervisor', 'admin'),
  noteAnalysisController.analyzeNote
);

// Download analysis report as PDF
router.get('/notes/:noteId/analysis-report',
  authenticate,
  authorize('staff', 'supervisor', 'admin'),
  noteAnalysisController.downloadAnalysisReport
);

module.exports = router;
