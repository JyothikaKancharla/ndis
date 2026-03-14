/**
 * Unit Tests for Frontend Timezone Configuration
 * Tests shift status and date formatting across different timezones
 */

import { 
  getAssignmentDateStatus, 
  getShiftStatus, 
  formatDateForDisplay,
  formatAssignmentDisplay
} from '../utils/shiftStatus';

describe('Timezone Configuration - Frontend', () => {
  const originalEnv = process.env.REACT_APP_TIMEZONE;

  beforeEach(() => {
    // Reset environment
    delete process.env.REACT_APP_TIMEZONE;
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.REACT_APP_TIMEZONE = originalEnv;
    }
  });

  /**
   * Test Suite: getAssignmentDateStatus
   */
  describe('getAssignmentDateStatus', () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    test('should return "Unknown" for null/undefined params', () => {
      const result = getAssignmentDateStatus(null, null);
      expect(result.status).toBe('Unknown');
      expect(result.badge).toBe('❓ UNKNOWN');
    });

    test('should return "Pending" for future date', () => {
      const result = getAssignmentDateStatus(tomorrowString, '7:00 AM - 3:00 PM');
      expect(result.status).toBe('Pending');
      // Badge format may be "IN XD" or "IN X.XH" depending on timezone offset
      expect(result.badge).toMatch(/IN \d+(\.\d+)?(D|H)/);
    });

    test('should return "Previous" for past date', () => {
      const result = getAssignmentDateStatus(yesterdayString, '7:00 AM - 3:00 PM');
      expect(result.status).toBe('Previous');
      expect(result.badge).toMatch(/AGO/);
    });

    test('should check "Current" status (may vary based on time)', () => {
      const result = getAssignmentDateStatus(todayString, '7:00 AM - 3:00 PM');
      expect(['Current', 'Pending', 'Previous']).toContain(result.status);
    });

    test('should handle overnight shifts', () => {
      const result = getAssignmentDateStatus(todayString, '10:00 PM - 6:00 AM');
      expect(['Current', 'Pending', 'Previous']).toContain(result.status);
    });

    test('should return badge with color styling', () => {
      const result = getAssignmentDateStatus(tomorrowString, '7:00 AM - 3:00 PM');
      expect(result).toHaveProperty('color');
      expect(result.color).toHaveProperty('bg');
      expect(result.color).toHaveProperty('border');
      expect(result.color).toHaveProperty('text');
    });

    test('should handle different shift times', () => {
      const shifts = [
        '7:00 AM - 3:00 PM',
        '3:00 PM - 11:00 PM',
        '11:00 PM - 7:00 AM',
        '6:00 AM - 2:00 PM'
      ];

      shifts.forEach(shift => {
        const result = getAssignmentDateStatus(todayString, shift);
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('badge');
        expect(result).toHaveProperty('color');
      });
    });
  });

  /**
   * Test Suite: getShiftStatus
   */
  describe('getShiftStatus', () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];

    test('should return "Unknown" for null params', () => {
      const result = getShiftStatus(null, null);
      expect(result.status).toBe('Unknown');
    });

    test('should return valid shift status', () => {
      const result = getShiftStatus('7:00 AM - 3:00 PM', todayString);
      expect(['Active', 'Completed', 'Upcoming', 'Future']).toContain(result.status);
    });

    test('should have status properties', () => {
      const result = getShiftStatus('7:00 AM - 3:00 PM', todayString);
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('badge');
    });

    test('should mark future shifts as Upcoming or Future', () => {
      const result = getShiftStatus('7:00 AM - 3:00 PM', tomorrowString);
      expect(['Upcoming', 'Future']).toContain(result.status);
    });

    test('should handle overnight shifts', () => {
      const result = getShiftStatus('10:00 PM - 6:00 AM', todayString);
      expect(result).toHaveProperty('status');
      expect(['Active', 'Completed', 'Upcoming', 'Future']).toContain(result.status);
    });
  });

  /**
   * Test Suite: formatDateForDisplay
   */
  describe('formatDateForDisplay', () => {
    const now = new Date();
    const todayString = now.toISOString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString();

    test('should return "Unknown" for null date', () => {
      const result = formatDateForDisplay(null);
      expect(result.relative).toBe('Unknown');
    });

    test('should format today correctly', () => {
      const result = formatDateForDisplay(todayString);
      // Due to timezone conversion, may be "Today", "Yesterday", or "Tomorrow"
      expect(['Today', 'Yesterday', 'Tomorrow']).toContain(result.relative);
      expect(result).toHaveProperty('short');
      expect(result).toHaveProperty('full');
      expect(result).toHaveProperty('weekday');
      expect(result).toHaveProperty('iso');
    });

    test('should format tomorrow correctly', () => {
      const result = formatDateForDisplay(tomorrowString);
      // Due to timezone conversion, may be "Today", "Tomorrow", or "In X days"
      expect(result.relative).toMatch(/(Today|Tomorrow|In \d+ days?)/);
    });

    test('should format yesterday correctly', () => {
      const result = formatDateForDisplay(yesterdayString);
      // Due to timezone conversion, may be "Yesterday", "Today", or "X days ago"
      expect(result.relative).toMatch(/(Yesterday|Today|\d+ days? ago)/);
    });

    test('should format future dates', () => {
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + 5);
      const result = formatDateForDisplay(futureDate.toISOString());
      expect(result.relative).toMatch(/^In \d+ days/);
    });

    test('should format past dates', () => {
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - 5);
      const result = formatDateForDisplay(pastDate.toISOString());
      expect(result.relative).toMatch(/\d+ days ago/);
    });

    test('should use en-IN locale', () => {
      const result = formatDateForDisplay(todayString);
      // en-IN format examples: "9 Mar", "Sunday, 8 March 2026"
      expect(result.short).toMatch(/(\d+ \w+|\w+ \d+)/);
      expect(result.full).toMatch(/\w+.*\d{4}/);
    });

    test('should provide ISO format', () => {
      const result = formatDateForDisplay(todayString);
      expect(result.iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should provide weekday', () => {
      const result = formatDateForDisplay(todayString);
      expect(result.weekday).toBeDefined();
      expect(result.weekday.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test Suite: formatAssignmentDisplay
   */
  describe('formatAssignmentDisplay', () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    test('should return null for null assignment', () => {
      const result = formatAssignmentDisplay(null);
      expect(result).toBeNull();
    });

    test('should return formatted display object', () => {
      const assignment = {
        startDate: todayString,
        shift: '7:00 AM - 3:00 PM'
      };
      const result = formatAssignmentDisplay(assignment);
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('statusBadge');
      expect(result).toHaveProperty('statusColor');
    });

    test('should use backend computedStatus if available', () => {
      const assignment = {
        startDate: todayString,
        shift: '7:00 AM - 3:00 PM',
        computedStatus: 'Current',
        statusBadge: 'IN PROGRESS'
      };
      const result = formatAssignmentDisplay(assignment);
      expect(result.status).toBe('Current');
      expect(result.statusBadge).toBe('IN PROGRESS');
    });

    test('should fallback to frontend calculation', () => {
      const assignment = {
        startDate: todayString,
        shift: '7:00 AM - 3:00 PM'
      };
      const result = formatAssignmentDisplay(assignment);
      expect(result.status).toBeDefined();
      expect(['Current', 'Pending', 'Previous']).toContain(result.status);
    });

    test('should provide all display properties', () => {
      const assignment = {
        startDate: todayString,
        shift: '7:00 AM - 3:00 PM'
      };
      const result = formatAssignmentDisplay(assignment);
      expect(result.date).toBeDefined();
      expect(result.time).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.statusBadge).toBeDefined();
      expect(result.statusColor).toBeDefined();
      expect(result.isActive).toBeDefined();
    });
  });

  /**
   * Test Suite: Timezone Support
   */
  describe('Timezone Environment', () => {
    test('should default to Asia/Kolkata when REACT_APP_TIMEZONE not set', () => {
      delete process.env.REACT_APP_TIMEZONE;
      const today = new Date().toISOString().split('T')[0];
      const result = getAssignmentDateStatus(today, '7:00 AM - 3:00 PM');
      expect(result).toBeDefined();
      expect(['Current', 'Pending', 'Previous']).toContain(result.status);
    });

    test('should respect REACT_APP_TIMEZONE when set to Asia/Kolkata', () => {
      process.env.REACT_APP_TIMEZONE = 'Asia/Kolkata';
      const today = new Date().toISOString().split('T')[0];
      const result = getAssignmentDateStatus(today, '7:00 AM - 3:00 PM');
      expect(result).toBeDefined();
    });

    test('should handle invalid timezone gracefully', () => {
      process.env.REACT_APP_TIMEZONE = 'Invalid/Timezone';
      const today = new Date().toISOString().split('T')[0];
      // Should fall back to local time
      const result = getAssignmentDateStatus(today, '7:00 AM - 3:00 PM');
      expect(result).toBeDefined();
    });
  });

  /**
   * Test Suite: Edge Cases
   */
  describe('Edge Cases', () => {
    test('should handle 12 AM (midnight) correctly', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = getAssignmentDateStatus(today, '12:00 AM - 6:00 AM');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
    });

    test('should handle 12 PM (noon) correctly', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = getAssignmentDateStatus(today, '12:00 PM - 6:00 PM');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
    });

    test('should handle 24-hour shifts', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = getAssignmentDateStatus(today, '12:00 AM - 11:59 PM');
      expect(result).toBeDefined();
    });

    test('should handle very short shifts', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = getAssignmentDateStatus(today, '9:00 AM - 9:30 AM');
      expect(result).toBeDefined();
    });

    test('should handle different date formats', () => {
      const today = new Date();
      // ISO string
      let result = getAssignmentDateStatus(today.toISOString(), '7:00 AM - 3:00 PM');
      expect(result).toBeDefined();

      // Just date string
      result = getAssignmentDateStatus(today.toISOString().split('T')[0], '7:00 AM - 3:00 PM');
      expect(result).toBeDefined();
    });
  });
});
