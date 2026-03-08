import {
  getAssignmentDateStatus,
  getShiftStatus,
  formatDateForDisplay,
} from '../utils/shiftStatus';

// Helper: build a date string for today with a given hour offset
const todayAt = (hourOffset = 0) => {
  const d = new Date();
  d.setHours(d.getHours() + hourOffset, 0, 0, 0);
  return d;
};

const toDateStr = (date) => date.toISOString().split('T')[0];

const pad = (n) => String(n).padStart(2, '0');

// Format a Date into "H:MM AM/PM" shift string
const toShiftString = (start, end) => {
  const fmt = (d) => {
    let h = d.getHours();
    const m = pad(d.getMinutes());
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${period}`;
  };
  return `${fmt(start)} - ${fmt(end)}`;
};

// ─── getAssignmentDateStatus ───────────────────────────────────────────────

describe('getAssignmentDateStatus', () => {
  test('returns Unknown when inputs are missing', () => {
    expect(getAssignmentDateStatus(null, null).status).toBe('Unknown');
    expect(getAssignmentDateStatus('2024-01-01', null).status).toBe('Unknown');
    expect(getAssignmentDateStatus(null, '9:00 AM - 5:00 PM').status).toBe('Unknown');
  });

  test('returns Current when today and within shift hours', () => {
    const now = new Date();
    const start = todayAt(-1); // 1 hour ago
    const end = todayAt(1);    // 1 hour from now
    const shiftStr = toShiftString(start, end);
    const result = getAssignmentDateStatus(toDateStr(now), shiftStr);
    expect(result.status).toBe('Current');
  });

  test('returns Pending when today but shift has not started yet', () => {
    const now = new Date();
    const start = todayAt(2);  // 2 hours from now
    const end = todayAt(4);
    const shiftStr = toShiftString(start, end);
    const result = getAssignmentDateStatus(toDateStr(now), shiftStr);
    expect(result.status).toBe('Pending');
  });

  test('returns Previous when today but shift has already ended', () => {
    const now = new Date();
    const start = todayAt(-4); // 4 hours ago
    const end = todayAt(-2);   // 2 hours ago
    const shiftStr = toShiftString(start, end);
    const result = getAssignmentDateStatus(toDateStr(now), shiftStr);
    expect(result.status).toBe('Previous');
  });

  test('returns Pending for a future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const result = getAssignmentDateStatus(toDateStr(future), '9:00 AM - 5:00 PM');
    expect(result.status).toBe('Pending');
  });

  test('returns Previous for a past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    const result = getAssignmentDateStatus(toDateStr(past), '9:00 AM - 5:00 PM');
    expect(result.status).toBe('Previous');
  });

  test('badge contains D for future day count', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const result = getAssignmentDateStatus(toDateStr(future), '9:00 AM - 5:00 PM');
    expect(result.badge).toContain('D');
  });
});

// ─── getShiftStatus ────────────────────────────────────────────────────────

describe('getShiftStatus', () => {
  test('returns Unknown when inputs are missing', () => {
    expect(getShiftStatus(null, null).status).toBe('Unknown');
  });

  test('returns Active when currently within shift hours', () => {
    const now = new Date();
    const start = todayAt(-1);
    const end = todayAt(1);
    const result = getShiftStatus(toShiftString(start, end), toDateStr(now));
    expect(result.status).toBe('Active');
  });

  test('returns Completed when shift has ended', () => {
    const now = new Date();
    const start = todayAt(-4);
    const end = todayAt(-2);
    const result = getShiftStatus(toShiftString(start, end), toDateStr(now));
    expect(result.status).toBe('Completed');
  });

  test('returns Upcoming when shift starts within 24 hours', () => {
    const now = new Date();
    const start = todayAt(2);
    const end = todayAt(4);
    const result = getShiftStatus(toShiftString(start, end), toDateStr(now));
    expect(result.status).toBe('Upcoming');
  });
});

// ─── formatDateForDisplay ──────────────────────────────────────────────────

describe('formatDateForDisplay', () => {
  test('returns Unknown for null input', () => {
    expect(formatDateForDisplay(null).relative).toBe('Unknown');
  });

  test('returns Today for current date', () => {
    const result = formatDateForDisplay(toDateStr(new Date()));
    expect(result.relative).toBe('Today');
  });

  test('returns Tomorrow for next day', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = formatDateForDisplay(toDateStr(tomorrow));
    expect(result.relative).toBe('Tomorrow');
  });

  test('returns Yesterday for previous day', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatDateForDisplay(toDateStr(yesterday));
    expect(result.relative).toBe('Yesterday');
  });

  test('returns days ago for older dates', () => {
    const old = new Date();
    old.setDate(old.getDate() - 5);
    const result = formatDateForDisplay(toDateStr(old));
    expect(result.relative).toBe('5 days ago');
  });

  test('returns In X days for future dates', () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    const result = formatDateForDisplay(toDateStr(future));
    expect(result.relative).toBe('In 7 days');
  });

  test('returns short, full, weekday, iso fields', () => {
    const result = formatDateForDisplay(toDateStr(new Date()));
    expect(result.short).toBeTruthy();
    expect(result.full).toBeTruthy();
    expect(result.weekday).toBeTruthy();
    expect(result.iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
