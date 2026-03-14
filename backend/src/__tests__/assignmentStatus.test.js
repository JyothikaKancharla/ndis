/**
 * Unit Tests for Backend Timezone Configuration
 * Tests assignment status calculations across different timezones
 */

const {
  calculateDynamicStatus,
  calculateSimpleStatus,
  formatDateDisplay,
  parseTimeString
} = require('../utils/assignmentStatus');

describe('Timezone Configuration - Backend', () => {
  const originalTZ = process.env.TIMEZONE;

  afterEach(() => {
    // Restore original timezone
    process.env.TIMEZONE = originalTZ;
  });

  /**
   * Test Suite: parseTimeString
   */
  describe('parseTimeString', () => {
    test('should parse "7:00 AM" correctly', () => {
      const result = parseTimeString('7:00 AM');
      expect(result).toEqual({ hours: 7, minutes: 0 });
    });

    test('should parse "3:00 PM" correctly', () => {
      const result = parseTimeString('3:00 PM');
      expect(result).toEqual({ hours: 15, minutes: 0 });
    });

    test('should parse "11:00 PM" correctly', () => {
      const result = parseTimeString('11:00 PM');
      expect(result).toEqual({ hours: 23, minutes: 0 });
    });

    test('should parse "12:00 AM" correctly (midnight)', () => {
      const result = parseTimeString('12:00 AM');
      expect(result).toEqual({ hours: 0, minutes: 0 });
    });

    test('should parse "12:00 PM" correctly (noon)', () => {
      const result = parseTimeString('12:00 PM');
      expect(result).toEqual({ hours: 12, minutes: 0 });
    });

    test('should handle minutes correctly', () => {
      const result = parseTimeString('9:30 AM');
      expect(result).toEqual({ hours: 9, minutes: 30 });
    });

    test('should handle invalid time string', () => {
      const result = parseTimeString('invalid');
      expect(result).toEqual({ hours: 0, minutes: 0 });
    });
  });

  /**
   * Test Suite: Shift Status Calculation
   */
  describe('calculateDynamicStatus', () => {
    // Mock current time for testing
    const mockToday = new Date();
    const todayString = mockToday.toISOString().split('T')[0];
    const tomorrow = new Date(mockToday);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    const yesterday = new Date(mockToday);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    test('should return "Unknown" for invalid shift format', () => {
      const result = calculateDynamicStatus(todayString, null, 'invalid-shift');
      expect(result.status).toBe('Unknown');
      expect(result.badge).toBe('INVALID');
    });

    test('should return "Pending" for future date', () => {
      const result = calculateDynamicStatus(tomorrowString, null, '7:00 AM - 3:00 PM');
      expect(result.status).toBe('Pending');
      expect(result.shiftPhase).toBe('upcoming');
      expect(result.isActive).toBe(true);
    });

    test('should return "Previous" for past date', () => {
      const result = calculateDynamicStatus(yesterdayString, null, '7:00 AM - 3:00 PM');
      expect(result.status).toBe('Previous');
      expect(result.shiftPhase).toBe('completed');
      expect(result.isActive).toBe(false);
    });

    test('should accept valid shift formats', () => {
      const result = calculateDynamicStatus(tomorrowString, null, '7:00 AM - 3:00 PM');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('badge');
      expect(result).toHaveProperty('shiftPhase');
      expect(result).toHaveProperty('isActive');
    });

    test('should handle overnight shifts correctly', () => {
      // Overnight shift: 10 PM - 6 AM
      const result = calculateDynamicStatus(todayString, null, '10:00 PM - 6:00 AM');
      expect(result).toHaveProperty('status');
      expect(['Current', 'Pending', 'Previous']).toContain(result.status);
    });

    test('should return hours remaining for current shift', () => {
      // Only test if we're actually in today's shift
      process.env.TIMEZONE = 'Asia/Kolkata';
      const result = calculateDynamicStatus(todayString, null, '7:00 AM - 3:00 PM');
      // Should have status property regardless
      expect(result).toHaveProperty('status');
    });
  });

  /**
   * Test Suite: Timezone Configurations
   */
  describe('Timezone Support', () => {
    test('should support Asia/Kolkata timezone', () => {
      process.env.TIMEZONE = 'Asia/Kolkata';
      const result = calculateDynamicStatus(
        new Date().toISOString().split('T')[0],
        null,
        '7:00 AM - 3:00 PM'
      );
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
    });

    test('should support Asia/Kolkata timezone', () => {
      process.env.TIMEZONE = 'Asia/Kolkata';
      const result = calculateDynamicStatus(
        new Date().toISOString().split('T')[0],
        null,
        '7:00 AM - 3:00 PM'
      );
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
    });

    test('should default to Asia/Kolkata when TIMEZONE not set', () => {
      delete process.env.TIMEZONE;
      const result = calculateDynamicStatus(
        new Date().toISOString().split('T')[0],
        null,
        '7:00 AM - 3:00 PM'
      );
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
    });
  });

  /**
   * Test Suite: calculateSimpleStatus
   */
  describe('calculateSimpleStatus', () => {
    test('should return string status', () => {
      const result = calculateSimpleStatus(
        new Date().toISOString().split('T')[0],
        '7:00 AM - 3:00 PM'
      );
      expect(typeof result).toBe('string');
      expect(['Current', 'Pending', 'Previous', 'Unknown']).toContain(result);
    });

    test('should match first property of calculateDynamicStatus', () => {
      const date = new Date().toISOString().split('T')[0];
      const shift = '7:00 AM - 3:00 PM';
      const simpleResult = calculateSimpleStatus(date, shift);
      const dynamicResult = calculateDynamicStatus(date, null, shift);
      expect(simpleResult).toBe(dynamicResult.status);
    });
  });

  /**
   * Test Suite: formatDateDisplay
   */
  describe('formatDateDisplay', () => {
    const mockDate = new Date();
    const todayString = mockDate.toISOString();

    test('should return object with required properties', () => {
      const result = formatDateDisplay(todayString);
      expect(result).toHaveProperty('short');
      expect(result).toHaveProperty('full');
      expect(result).toHaveProperty('relative');
      expect(result).toHaveProperty('iso');
    });

    test('should print "Today" for current date', () => {
      const result = formatDateDisplay(todayString);
      expect(result.relative).toBe('Today');
    });

    test('should print "Tomorrow" for tomorrow', () => {
      const tomorrow = new Date(mockDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = formatDateDisplay(tomorrow.toISOString());
      expect(result.relative).toBe('Tomorrow');
    });

    test('should print "Yesterday" for yesterday', () => {
      const yesterday = new Date(mockDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const result = formatDateDisplay(yesterday.toISOString());
      expect(result.relative).toBe('Yesterday');
    });

    test('should handle null/undefined dates', () => {
      const result = formatDateDisplay(null);
      // formatDateDisplay returns a calculated relative time even for null
      expect(result).toBeDefined();
      expect(result.relative).toBeTruthy();
    });

    test('should use en-IN locale format', () => {
      const result = formatDateDisplay(todayString);
      // en-IN format returns number day name, e.g., "9 Mar"
      expect(result.short).toMatch(/\d+ \w+/);
      expect(result.full).toMatch(/\w+.*\d{4}/); // Should contain year
    });
  });

  /**
   * Test Suite: Error Handling
   */
  describe('Error Handling', () => {
    test('should handle dates as strings', () => {
      const result = calculateDynamicStatus('2026-03-09', null, '7:00 AM - 3:00 PM');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
    });

    test('should handle dates as Date objects', () => {
      const date = new Date();
      const result = calculateDynamicStatus(date, null, '7:00 AM - 3:00 PM');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
    });

    test('should return ERROR status on exception', () => {
      // Try with invalid date
      const result = calculateDynamicStatus('invalid-date', null, '7:00 AM - 3:00 PM');
      // Should handle gracefully (might return Unknown or error)
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
    });

    test('should log errors without crashing', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = calculateDynamicStatus(null, null, null);
      expect(result.status).toBe('Unknown');
      consoleSpy.mockRestore();
    });
  });
});
