const Assignment = require('../models/Assignment');

// Business timezone offset (IST = UTC+5:30). Shift times are always in this timezone.
const BUSINESS_TZ_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Get the current time shifted into the business timezone (IST).
 * Using getUTCHours()/getUTCMinutes() on the returned Date gives IST values.
 */
function getNowInBusinessTZ() {
  return new Date(Date.now() + BUSINESS_TZ_OFFSET_MS);
}

/**
 * Parse time string in format "7:00 AM" or "11:00 PM" to minutes since midnight
 * @param {string} timeStr - Time in format "H:MM AM/PM"
 * @returns {number} Minutes since midnight (0-1439)
 */
function parseTimeString(timeStr) {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  let hour = parseInt(match[1]);
  const minute = parseInt(match[2]);
  const period = match[3].toUpperCase();

  // Convert to 24-hour format
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  }
  if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minute;
}

/**
 * Check if current time is within the shift time range
 * Handles overnight shifts (e.g., "11:00 PM - 7:00 AM")
 * @param {string} shiftString - Shift in format "7:00 AM - 3:00 PM"
 * @param {Date} currentDate - Current date/time to check
 * @returns {object} { isActive: boolean, status: string, timeInfo: object }
 */
function isWithinShiftTime(shiftString, currentDate = new Date()) {
  try {
    // Parse shift string (e.g., "7:00 AM - 3:00 PM")
    const parts = shiftString.split(' - ');
    if (parts.length !== 2) {
      throw new Error(`Invalid shift format: ${shiftString}`);
    }

    const startMinutes = parseTimeString(parts[0].trim());
    const endMinutes = parseTimeString(parts[1].trim());

    // Get current time in business timezone (IST) minutes since midnight
    const businessNow = new Date(currentDate.getTime() + BUSINESS_TZ_OFFSET_MS);
    const currentHour = businessNow.getUTCHours();
    const currentMinute = businessNow.getUTCMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;

    let isActive = false;
    let status = 'Unknown';
    const timeInfo = {
      shift: shiftString,
      currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
      startMinutes,
      endMinutes,
      currentMinutes
    };

    // Handle overnight shifts (end time is before start time)
    if (endMinutes < startMinutes) {
      // Overnight shift: active if time >= start OR time < end
      isActive = currentMinutes >= startMinutes || currentMinutes < endMinutes;

      if (isActive) {
        status = 'Active';
      } else if (currentMinutes < startMinutes) {
        status = 'Upcoming';
        const minutesUntilStart = startMinutes - currentMinutes;
        timeInfo.startsIn = formatDuration(minutesUntilStart);
      } else {
        status = 'Completed';
        const minutesSinceEnd = currentMinutes - endMinutes;
        timeInfo.endedAgo = formatDuration(minutesSinceEnd);
      }
    } else {
      // Regular shift: active if time >= start AND time < end
      isActive = currentMinutes >= startMinutes && currentMinutes < endMinutes;

      if (isActive) {
        status = 'Active';
        const minutesRemaining = endMinutes - currentMinutes;
        timeInfo.endsIn = formatDuration(minutesRemaining);
      } else if (currentMinutes < startMinutes) {
        status = 'Upcoming';
        const minutesUntilStart = startMinutes - currentMinutes;
        timeInfo.startsIn = formatDuration(minutesUntilStart);
      } else {
        status = 'Completed';
        const minutesSinceEnd = currentMinutes - endMinutes;
        timeInfo.endedAgo = formatDuration(minutesSinceEnd);
      }
    }

    return { isActive, status, timeInfo };
  } catch (error) {
    console.error('Error parsing shift time:', error);
    return {
      isActive: false,
      status: 'Error',
      timeInfo: { error: error.message }
    };
  }
}

/**
 * Format duration in minutes to human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "2 hours", "30 minutes")
 */
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
}

/**
 * Middleware to validate that staff is within their active shift time
 * Queries the Assignment model to find today's shift for the staff-client pair
 *
 * Rules:
 * - Active shift: Allow all note operations
 * - Completed shift: Allow consolidated notes (post-shift consolidation)
 * - Upcoming shift: Block all note operations (shift hasn't started)
 *
 * Returns 403 error if not allowed
 */
const validateActiveShift = async (req, res, next) => {
  try {
    const staffId = req.user.id;
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID is required'
      });
    }

    // Enforce assignment and shift checks only for `staff` role.
    // Supervisors and admins may perform consolidation or view notes without an active assignment.
    if (req.user.role === 'staff') {
      // Find active assignment for this staff-client pair
      const assignment = await Assignment.findOne({
        staffId,
        clientId,
        isActive: true
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'No active assignment found for this client',
          shiftInfo: null
        });
      }

      // Check if current time is within shift time
      const shiftCheck = isWithinShiftTime(assignment.shift);

      // Check if this is a consolidation request (noteType = 'consolidated')
      const isConsolidationRequest = req.body?.noteType === 'consolidated';

      // Allow note creation if:
      // 1. Shift is currently active, OR
      // 2. Shift has completed AND this is a consolidation request
      const allowOperation = shiftCheck.isActive ||
                            (shiftCheck.status === 'Completed' && isConsolidationRequest);

      if (!allowOperation) {
        // Determine appropriate error message
        let message;
        if (shiftCheck.status === 'Upcoming') {
          message = 'Notes cannot be created before your shift starts';
        } else if (shiftCheck.status === 'Completed' && !isConsolidationRequest) {
          message = 'Only consolidation is allowed after shift ends. Regular notes must be created during active shifts.';
        } else {
          message = 'Notes can only be created during your active shift';
        }

        return res.status(403).json({
          success: false,
          message,
          shiftInfo: {
            shift: assignment.shift,
            status: shiftCheck.status,
            ...shiftCheck.timeInfo
          }
        });
      }

      // Operation allowed, proceed to next middleware
      req.assignment = assignment; // Attach assignment to request for potential use in controller
      req.shiftStatus = shiftCheck.status; // Attach shift status for controller use
      next();
      return;
    }

    // For supervisors/admins, skip assignment and shift enforcement
    next();
  } catch (error) {
    console.error('Error validating active shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate shift status',
      error: error.message
    });
  }
};

module.exports = validateActiveShift;
module.exports.isWithinShiftTime = isWithinShiftTime;
module.exports.parseTimeString = parseTimeString;
