const { VALID_SHIFT_TIMES } = require('../constants/shifts');

const validateShift = (req, res, next) => {
  const { shift } = req.body;
  
  if (shift && !VALID_SHIFT_TIMES.includes(shift)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid shift time',
      validShifts: VALID_SHIFT_TIMES
    });
  }
  
  next();
};

module.exports = validateShift;
