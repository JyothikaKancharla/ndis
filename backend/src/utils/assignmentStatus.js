/**
 * Shared utility for calculating assignment status dynamically
 * Uses India Standard Time (IST, Asia/Kolkata, UTC+5:30)
 */

/**
 * Get current time in IST
 */
const getConfiguredTime = () => {
  const timezone = process.env.TIMEZONE || 'Asia/Kolkata';

  try {
    const utcDate = new Date();
    const timeString = utcDate.toLocaleString('en-US', {
      timeZone: timezone
    });
    const configDate = new Date(timeString);
    return configDate;
  } catch (e) {
    console.warn(`Invalid timezone: ${timezone}, falling back to local time`, e);
    return new Date();
  }
};

/**
 * Get timezone offset in milliseconds (IST = UTC+5:30)
 * KEPT FOR LEGACY - Use getConfiguredTime() instead
 */
const getTZOffset = () => {
  return 5.5 * 60 * 60 * 1000; // IST = UTC+5:30
};

/**
 * Get a "fake-UTC" Date representing the current moment in IST.
 */
const nowInBusinessTZ = () => new Date(Date.now() + getTZOffset());

/**
 * Normalise a stored date to IST midnight, returned as a comparable timestamp.
 */
const toBusinessTZMidnight = (date) => {
  const shifted = new Date(new Date(date).getTime() + getTZOffset());
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
};

/**
 * Parse time string in format "7:00 AM" or "11:00 PM" to hours/minutes
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
 */
// eslint-disable-next-line no-unused-vars
const calculateDynamicStatus = (startDate, _endDate, shift) => {
  try {
    const now = getConfiguredTime();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const assignDay = new Date(startDate);
    assignDay.setHours(0, 0, 0, 0);

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

    let shiftStart = new Date(assignDay);
    shiftStart.setHours(startTime.hours, startTime.minutes, 0, 0);

    let shiftEnd = new Date(assignDay);
    shiftEnd.setHours(endTime.hours, endTime.minutes, 0, 0);

    // Handle overnight shifts (e.g., 10:00 PM - 6:00 AM)
    if (shiftEnd < shiftStart) {
      shiftEnd.setDate(shiftEnd.getDate() + 1);
    }

    // Current: Today AND within shift times
    if (assignDay.getTime() === today.getTime() && now >= shiftStart && now < shiftEnd) {
      const hoursRemaining = Math.ceil((shiftEnd - now) / (1000 * 60 * 60));
      return {
        status: 'Current',
        badge: 'IN PROGRESS',
        shiftPhase: 'active',
        isActive: true,
        hoursRemaining
      };
    }

    // Upcoming: Future date OR today before shift starts
    if (assignDay.getTime() > today.getTime() || (assignDay.getTime() === today.getTime() && now < shiftStart)) {
      const daysUntil = Math.floor((assignDay - today) / (1000 * 60 * 60 * 24));
      const hoursUntil = Math.ceil((shiftStart - now) / (1000 * 60 * 60));

      let badge;
      if (daysUntil === 0) {
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

    // Previous: Past date OR today after shift ended
    const daysSince = Math.floor((today - assignDay) / (1000 * 60 * 60 * 24));
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
 * Simple status calculation (returns string only)
 */
const calculateSimpleStatus = (startDate, shift) => {
  const result = calculateDynamicStatus(startDate, null, shift);
  return result.status;
};

/**
 * Format date for display
 */
const formatDateDisplay = (date) => {
  const d = new Date(date);
  const nowAET = nowInBusinessTZ();
  const today = new Date(Date.UTC(nowAET.getUTCFullYear(), nowAET.getUTCMonth(), nowAET.getUTCDate()));
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
    short: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    full: d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
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
