/**
 * Get assignment status based on DATE + SHIFT TIME
 * 
 * Rules:
 * - Current: Today AND current time is between shift start and end
 * - Pending: Future date OR today but shift hasn't started yet
 * - Previous: Past date OR shift has already ended
 * 
 * Returns: { status: 'Current' | 'Pending' | 'Previous', badge: string, color: object }
 */

export const getAssignmentDateStatus = (assignmentDate, shiftTime) => {
  if (!assignmentDate || !shiftTime) {
    return { status: 'Unknown', badge: '❓ UNKNOWN', color: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' } };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const assignDay = new Date(assignmentDate);
  assignDay.setHours(0, 0, 0, 0);

  // Parse shift time (e.g., "6:00 AM - 2:00 PM")
  const [startStr, endStr] = shiftTime.split(' - ');
  const startTime = parseTimeString(startStr);
  const endTime = parseTimeString(endStr);

  // Create shift start and end times
  let shiftStart = new Date(assignDay);
  shiftStart.setHours(startTime.hours, startTime.minutes, 0, 0);

  let shiftEnd = new Date(assignDay);
  shiftEnd.setHours(endTime.hours, endTime.minutes, 0, 0);

  // Handle overnight shifts (e.g., 10:00 PM - 6:00 AM)
  if (shiftEnd < shiftStart) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  // 1️⃣ CHECK IF CURRENT (today AND within shift time)
  if (assignDay.getTime() === today.getTime() && now >= shiftStart && now < shiftEnd) {
    return { 
      status: 'Current', 
      badge: '✅ CURRENT',
      color: { bg: '#ecfdf5', border: '#10b981', text: '#047857' }
    };
  }

  // 2️⃣ CHECK IF PENDING (future OR today but before shift starts)
  if (assignDay.getTime() > today.getTime() || (assignDay.getTime() === today.getTime() && now < shiftStart)) {
    const daysUntil = Math.ceil((assignDay - today) / (1000 * 60 * 60 * 24));
    if (daysUntil === 0) {
      // Today but shift hasn't started
      const minutesUntil = Math.ceil((shiftStart - now) / (1000 * 60));
      const hoursStr = Math.round((minutesUntil / 60) * 10) / 10;
      return { 
        status: 'Pending', 
        badge: `⏳ IN ${hoursStr}H`,
        color: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' }
      };
    } else {
      return { 
        status: 'Pending', 
        badge: `⏳ IN ${daysUntil}D`,
        color: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' }
      };
    }
  }

  // 3️⃣ DEFAULT TO PREVIOUS (past date OR shift has ended)
  const daysSince = Math.ceil((today - assignDay) / (1000 * 60 * 60 * 24));
  return { 
    status: 'Previous', 
    badge: `🕒 ${daysSince}D AGO`,
    color: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' }
  };
};

/**
 * Sort assignments by status priority
 * Order: Current → Pending → Previous
 */
export const sortAssignmentsByDateStatus = (assignments) => {
  const statusPriority = {
    'Current': 0,
    'Pending': 1,
    'Previous': 2
  };

  return [...assignments].sort((a, b) => {
    const aStatus = getAssignmentDateStatus(a.startDate, a.shift).status;
    const bStatus = getAssignmentDateStatus(b.startDate, b.shift).status;
    return (statusPriority[aStatus] || 99) - (statusPriority[bStatus] || 99);
  });
};

/**
 * Get shift status based on current time and shift timing
 * FOR SCHEDULING/SHIFT VIEW - not for assignment date status
 * Returns: { status: 'Active' | 'Completed' | 'Upcoming', color: string, icon: string }
 */
export const getShiftStatus = (shiftTime, shiftDate) => {
  if (!shiftTime || !shiftDate) {
    return { status: 'Unknown', color: '#999', icon: '❓' };
  }

  const now = new Date();
  const shiftDay = new Date(shiftDate);
  shiftDay.setHours(0, 0, 0, 0);

  // Parse shift time (e.g., "6:00 AM - 2:00 PM")
  const [startStr, endStr] = shiftTime.split(' - ');
  const startTime = parseTimeString(startStr);
  const endTime = parseTimeString(endStr);

  // Handle overnight shifts (e.g., 10:00 PM - 6:00 AM)
  let shiftStart = new Date(shiftDay);
  shiftStart.setHours(startTime.hours, startTime.minutes, 0, 0);

  let shiftEnd = new Date(shiftDay);
  shiftEnd.setHours(endTime.hours, endTime.minutes, 0, 0);

  // If end time is earlier than start time, it's an overnight shift
  if (shiftEnd < shiftStart) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  // Check if shift is happening now
  if (now >= shiftStart && now < shiftEnd) {
    return { status: 'Active', color: '#10b981', icon: '🟢', badge: '● ACTIVE' };
  }

  // Check if shift has completed
  if (now >= shiftEnd) {
    return { status: 'Completed', color: '#6b7280', icon: '✓', badge: '✓ COMPLETED' };
  }

  // Check if shift is upcoming (within 24 hours)
  const hoursUntilShift = (shiftStart - now) / (1000 * 60 * 60);
  if (hoursUntilShift <= 24) {
    const hoursStr = Math.round(hoursUntilShift * 10) / 10;
    return { 
      status: 'Upcoming', 
      color: '#f59e0b', 
      icon: '⏱️', 
      badge: `↑ IN ${hoursStr}H`,
      hours: hoursStr 
    };
  }

  // Shift is later (upcoming)
  return { status: 'Future', color: '#9ca3af', icon: '⬆️', badge: '⬆ UPCOMING' };
};

/**
 * Parse time string like "6:00 AM" or "2:00 PM"
 */
const parseTimeString = (timeStr) => {
  const trimmed = timeStr.trim();
  const [time, period] = trimmed.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
};

/**
 * Get status color styling based on status
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'Current':
      return { bg: '#ecfdf5', border: '#10b981', text: '#047857' };
    case 'Pending':
      return { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' };
    case 'Previous':
      return { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' };
    default:
      return { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' };
  }
};

/**
 * Format date for display with relative and absolute formats
 */
export const formatDateForDisplay = (date) => {
  if (!date) return { relative: 'Unknown', short: '', full: '' };

  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateDay = new Date(d);
  dateDay.setHours(0, 0, 0, 0);

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
    relative,
    short: d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
    full: d.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    weekday: d.toLocaleDateString('en-AU', { weekday: 'short' }),
    iso: d.toISOString().split('T')[0]
  };
};

/**
 * Format assignment for display with date, time, and status
 * Combines backend computedStatus (if available) with frontend calculation
 *
 * @param {object} assignment - Assignment object with startDate, shift, and optionally computedStatus
 * @returns {object} Formatted display data { date, fullDate, time, status, statusBadge, statusColor, isActive }
 */
export const formatAssignmentDisplay = (assignment) => {
  if (!assignment) return null;

  // Get date display
  const dateDisplay = formatDateForDisplay(assignment.startDate || assignment.date);

  // Get status - prefer backend computedStatus, fallback to frontend calculation
  let status, statusBadge, statusColor;

  if (assignment.computedStatus) {
    // Use backend-provided status
    status = assignment.computedStatus;
    statusBadge = assignment.statusBadge || status.toUpperCase();
    statusColor = getStatusColor(status);
  } else if (assignment.startDate && assignment.shift) {
    // Calculate on frontend
    const calculated = getAssignmentDateStatus(assignment.startDate, assignment.shift);
    status = calculated.status;
    statusBadge = calculated.badge;
    statusColor = calculated.color;
  } else {
    // Unknown status
    status = 'Unknown';
    statusBadge = 'UNKNOWN';
    statusColor = { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' };
  }

  return {
    date: dateDisplay.relative,
    shortDate: dateDisplay.short,
    fullDate: dateDisplay.full,
    weekday: dateDisplay.weekday,
    time: assignment.shift || assignment.fullShift || `${assignment.startTime} - ${assignment.endTime}`,
    status,
    statusBadge,
    statusColor,
    isActive: status === 'Current',
    shiftPhase: assignment.shiftPhase || (status === 'Current' ? 'active' : status === 'Pending' ? 'upcoming' : 'completed')
  };
};
