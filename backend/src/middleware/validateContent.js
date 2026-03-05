/**
 * Data Validation Middleware
 * Validates content length, required fields, and data integrity
 * Ensures consistency across NDIS care notes system
 */

const validateNoteContent = (req, res, next) => {
  const { content, category, clientId, shift, shiftDate } = req.body;

  if (!category) {
    return res.status(400).json({
      success: false,
      message: 'Category is required',
      errorCode: 'CATEGORY_REQUIRED'
    });
  }

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client is required',
      errorCode: 'CLIENT_REQUIRED'
    });
  }

  if (!content) {
    return res.status(400).json({
      success: false,
      message: 'Note content is required',
      errorCode: 'CONTENT_REQUIRED'
    });
  }

  // Check minimum length (10 characters)
  if (content.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Note must be at least 10 characters',
      errorCode: 'CONTENT_TOO_SHORT',
      currentLength: content.length
    });
  }

  // Check maximum length (2000 characters)
  if (content.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'Note cannot exceed 2000 characters',
      errorCode: 'CONTENT_TOO_LONG',
      currentLength: content.length,
      maxLength: 2000
    });
  }

  next();
};

const validateTripContent = (req, res, next) => {
  const { clientId, tripDate, startTime, endTime, purpose, startOdometer, endOdometer } = req.body;

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client is required',
      errorCode: 'CLIENT_REQUIRED'
    });
  }

  if (!tripDate) {
    return res.status(400).json({
      success: false,
      message: 'Trip date is required',
      errorCode: 'TRIP_DATE_REQUIRED'
    });
  }

  if (!startTime) {
    return res.status(400).json({
      success: false,
      message: 'Start time is required',
      errorCode: 'START_TIME_REQUIRED'
    });
  }

  if (!endTime) {
    return res.status(400).json({
      success: false,
      message: 'End time is required',
      errorCode: 'END_TIME_REQUIRED'
    });
  }

  // Validate time format (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    return res.status(400).json({
      success: false,
      message: 'Start time must be in HH:MM format',
      errorCode: 'INVALID_START_TIME'
    });
  }

  if (!/^\d{2}:\d{2}$/.test(endTime)) {
    return res.status(400).json({
      success: false,
      message: 'End time must be in HH:MM format',
      errorCode: 'INVALID_END_TIME'
    });
  }

  // Validate end time is after start time
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (endMinutes <= startMinutes) {
    return res.status(400).json({
      success: false,
      message: 'End time must be after start time',
      errorCode: 'INVALID_TIME_RANGE'
    });
  }

  if (!purpose) {
    return res.status(400).json({
      success: false,
      message: 'Purpose is required',
      errorCode: 'PURPOSE_REQUIRED'
    });
  }

  if (startOdometer === undefined || startOdometer === null) {
    return res.status(400).json({
      success: false,
      message: 'Start odometer reading is required',
      errorCode: 'START_ODOMETER_REQUIRED'
    });
  }

  if (endOdometer === undefined || endOdometer === null) {
    return res.status(400).json({
      success: false,
      message: 'End odometer reading is required',
      errorCode: 'END_ODOMETER_REQUIRED'
    });
  }

  // Validate odometer readings (must be positive numbers)
  if (isNaN(startOdometer) || startOdometer < 0) {
    return res.status(400).json({
      success: false,
      message: 'Start odometer must be a positive number',
      errorCode: 'INVALID_START_ODOMETER'
    });
  }

  if (isNaN(endOdometer) || endOdometer < 0) {
    return res.status(400).json({
      success: false,
      message: 'End odometer must be a positive number',
      errorCode: 'INVALID_END_ODOMETER'
    });
  }

  // End odometer must be greater than or equal to start odometer
  if (endOdometer < startOdometer) {
    return res.status(400).json({
      success: false,
      message: 'End odometer reading cannot be less than start reading',
      errorCode: 'INVALID_ODOMETER_RANGE',
      startOdometer: parseFloat(startOdometer),
      endOdometer: parseFloat(endOdometer)
    });
  }

  // Max distance per trip (prevent data entry errors) - 500km
  const distance = endOdometer - startOdometer;
  if (distance > 500) {
    return res.status(400).json({
      success: false,
      message: 'Distance cannot exceed 500km per trip. Please verify odometer readings.',
      errorCode: 'DISTANCE_TOO_LARGE',
      distance
    });
  }

  next();
};

const validateAssignmentContent = (req, res, next) => {
  const { staffId, clientId, shift, startDate } = req.body;

  if (!staffId) {
    return res.status(400).json({
      success: false,
      message: 'Staff member is required',
      errorCode: 'STAFF_REQUIRED'
    });
  }

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client is required',
      errorCode: 'CLIENT_REQUIRED'
    });
  }

  if (!shift) {
    return res.status(400).json({
      success: false,
      message: 'Shift is required',
      errorCode: 'SHIFT_REQUIRED'
    });
  }

  if (!startDate) {
    return res.status(400).json({
      success: false,
      message: 'Start date is required',
      errorCode: 'START_DATE_REQUIRED'
    });
  }

  const startDateObj = new Date(startDate);
  if (isNaN(startDateObj.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Start date must be a valid date',
      errorCode: 'INVALID_START_DATE'
    });
  }

  next();
};

/**
 * Validate staff member belongs to authenticated user or supervisor is authorizing
 */
const validateStaffOwnership = (req, res, next) => {
  const { staffId } = req.body;
  const userId = req.user?._id || req.user?.id;
  const userRole = req.user?.role;

  // Allow supervisors and admins to assign any staff
  if (userRole === 'supervisor' || userRole === 'admin') {
    return next();
  }

  // Staff can only create records for themselves
  if (staffId && staffId.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Staff can only create records for themselves',
      errorCode: 'STAFF_OWNERSHIP_VIOLATION'
    });
  }

  next();
};

module.exports = {
  validateNoteContent,
  validateTripContent,
  validateAssignmentContent,
  validateStaffOwnership
};
