/**
 * Shared utility for calculating assignment status dynamically
 * Used by both staff and supervisor controllers
 */

// Business timezone offset (IST = UTC+5:30). All shift times are in this timezone.
const BUSINESS_TZ_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Get a "fake-UTC" Date representing the current moment in the business timezone (IST).
 * Use getUTCFullYear/Month/Date/Hours/Minutes() on the result to get IST values.
 */
const nowInBusinessTZ = () => new Date(Date.now() + BUSINESS_TZ_OFFSET_MS);

/**
 * Normalise a stored date to IST midnight, returned as a comparable timestamp.
 * Stored dates may be UTC midnight (ISO date strings) or local-midnight depending on the server.
 * Shifting by the offset and extracting UTC components gives the correct IST calendar date.
 */
const toBusinessTZMidnight = (date) => {
  const shifted = new Date(new Date(date).getTime() + BUSINESS_TZ_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
};

/**
 * Parse time string in format "7:00 AM" or "11:00 PM" to hours/minutes
 * @param {string} timeStr - Time in format "H:MM AM/PM"
 * @returns {object} { hours, minutes }
 */
const parseTimeString = (timeStr) => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { hours: 0, minutes: 0 };

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
};

/**
 * Calculate assignment status dynamically based on date and shift time
 * @param {Date|string} startDate - Assignment start date
 * @param {Date|string|null} endDate - Assignment end date (optional)
 * @param {string} shift - Shift time string (e.g., "7:00 AM - 3:00 PM")
 * @returns {object} { status, badge, shiftPhase, isActive }
 */
const calculateDynamicStatus = (startDate, endDate, shift) => {
  try {
    // All date/time comparisons are done in the business timezone (IST = UTC+5:30).
    // nowIST and todayIST are "fake-UTC" dates whose getUTC* methods return IST values.
    const nowIST = nowInBusinessTZ();
    const todayIST = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()));
    const assignDayIST = toBusinessTZMidnight(startDate);

    // Validate shift format
    if (!shift || !shift.includes(' - ')) {
      return {
        status: 'Unknown',
        badge: 'INVALID',
        shiftPhase: 'unknown',
        isActive: false
      };
    }

    const [startStr, endStr] = shift.split(' - ');
    const startTime = parseTimeString(startStr);
    const endTime = parseTimeString(endStr);

    // Build shift start/end by adding IST hours to the IST midnight of the assignment day
    const msPerHour = 1000 * 60 * 60;
    const msPerDay = msPerHour * 24;

    let shiftStart = new Date(assignDayIST.getTime() + (startTime.hours * 60 + startTime.minutes) * 60 * 1000);
    let shiftEnd   = new Date(assignDayIST.getTime() + (endTime.hours   * 60 + endTime.minutes)   * 60 * 1000);

    // Handle overnight shifts (e.g., 10:00 PM - 6:00 AM)
    if (shiftEnd < shiftStart) {
      shiftEnd = new Date(shiftEnd.getTime() + msPerDay);
    }

    // Current: Today AND within shift times
    if (assignDayIST.getTime() === todayIST.getTime() && nowIST >= shiftStart && nowIST < shiftEnd) {
      const hoursRemaining = Math.ceil((shiftEnd - nowIST) / msPerHour);
      return {
        status: 'Current',
        badge: 'IN PROGRESS',
        shiftPhase: 'active',
        isActive: true,
        hoursRemaining
      };
    }

    // Upcoming: Future date OR today before shift starts
    if (assignDayIST.getTime() > todayIST.getTime() || (assignDayIST.getTime() === todayIST.getTime() && nowIST < shiftStart)) {
      const daysUntil = Math.floor((assignDayIST - todayIST) / msPerDay);
      let badge;

      if (daysUntil === 0) {
        const hoursUntil = Math.ceil((shiftStart - nowIST) / msPerHour);
        badge = hoursUntil <= 12 ? `IN ${hoursUntil}H` : 'TODAY';
      } else if (daysUntil === 1) {
        badge = 'TOMORROW';
      } else {
        badge = `IN ${daysUntil}D`;
      }

      return {
        status: 'Pending',
        badge,
        shiftPhase: 'upcoming',
        isActive: true,
        daysUntil
      };
    }

    // Completed: Past date OR today after shift ended
    const daysSince = Math.floor((todayIST - assignDayIST) / msPerDay);
    let badge;

    if (daysSince === 0) {
      badge = 'COMPLETED';
    } else if (daysSince === 1) {
      badge = 'YESTERDAY';
    } else {
      badge = `${daysSince}D AGO`;
    }

    return {
      status: 'Previous',
      badge,
      shiftPhase: 'completed',
      isActive: false,
      daysSince
    };
  } catch (error) {
    console.error('Error calculating assignment status:', error);
    return {
      status: 'Unknown',
      badge: 'ERROR',
      shiftPhase: 'unknown',
      isActive: false
    };
  }
};

/**
 * Simple status calculation (returns string only, for backward compatibility)
 * @param {Date|string} startDate - Assignment start date
 * @param {string} shift - Shift time string
 * @returns {string} 'Current' | 'Pending' | 'Previous'
 */
const calculateSimpleStatus = (startDate, shift) => {
  const result = calculateDynamicStatus(startDate, null, shift);
  return result.status;
};

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {object} { short, full, relative }
 */
const formatDateDisplay = (date) => {
  const d = new Date(date);
  const nowIST = nowInBusinessTZ();
  const today = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()));
  const dateDay = toBusinessTZMidnight(d);

  const diffDays = Math.floor((dateDay - today) / (1000 * 60 * 60 * 24));

  let relative;
  if (diffDays === 0) {
    relative = 'Today';
  } else if (diffDays === 1) {
    relative = 'Tomorrow';
  } else if (diffDays === -1) {
    relative = 'Yesterday';
  } else if (diffDays < -1) {
    relative = `${Math.abs(diffDays)} days ago`;
  } else {
    relative = `In ${diffDays} days`;
  }

  return {
    short: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    full: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    relative,
    iso: d.toISOString().split('T')[0]
  };
};

module.exports = {
  calculateDynamicStatus,
  calculateSimpleStatus,
  formatDateDisplay,
  parseTimeString
};
