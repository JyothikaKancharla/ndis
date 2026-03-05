const express = require('express');
const router = express.Router();
const { SHIFT_LIST, SHIFT_RATE_TYPES } = require('../constants/shifts');

/**
 * Get all available shifts
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: SHIFT_LIST,
    message: 'Shifts retrieved successfully'
  });
});

/**
 * Get all shift rate types
 */
router.get('/rates', (req, res) => {
  res.json({
    success: true,
    data: SHIFT_RATE_TYPES,
    message: 'Shift rate types retrieved successfully'
  });
});

module.exports = router;
