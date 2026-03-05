/**
 * NDIS Shift Configuration Constants
 * Defines all available shifts, shift times, and rate types for the care facility
 */

const SHIFTS = {
  MORNING: '7:00 AM - 3:00 PM',
  AFTERNOON: '3:00 PM - 11:00 PM',
  NIGHT: '11:00 PM - 7:00 AM',
  MORNING_ALT: '6:00 AM - 2:00 PM',
  AFTERNOON_ALT: '2:00 PM - 10:00 PM',
  NIGHT_ALT: '10:00 PM - 6:00 AM',
  DAY_12HR: '7:00 AM - 7:00 PM',
  NIGHT_12HR: '7:00 PM - 7:00 AM',
  SLEEPOVER: 'Sleepover'
};

const SHIFT_LIST = [
  { id: 'morning', label: 'Morning Shift', time: '7:00 AM - 3:00 PM', code: 'AM' },
  { id: 'afternoon', label: 'Afternoon Shift', time: '3:00 PM - 11:00 PM', code: 'PM' },
  { id: 'night', label: 'Night Shift', time: '11:00 PM - 7:00 AM', code: 'NIGHT' },
  { id: 'morning_alt', label: 'Morning (Alt)', time: '6:00 AM - 2:00 PM', code: 'AM-ALT' },
  { id: 'afternoon_alt', label: 'Afternoon (Alt)', time: '2:00 PM - 10:00 PM', code: 'PM-ALT' },
  { id: 'night_alt', label: 'Night (Alt)', time: '10:00 PM - 6:00 AM', code: 'NIGHT-ALT' },
  { id: 'day_12hr', label: 'Day (12hr)', time: '7:00 AM - 7:00 PM', code: 'DAY-12' },
  { id: 'night_12hr', label: 'Night (12hr)', time: '7:00 PM - 7:00 AM', code: 'NIGHT-12' },
  { id: 'sleepover', label: 'Sleepover', time: '10:00 PM - 6:00 AM', code: 'SLEEP' }
];

const SHIFT_RATE_TYPES = {
  STANDARD: { type: 'standard', multiplier: 1.0, description: 'Weekday 6AM - 8PM' },
  EVENING: { type: 'evening', multiplier: 1.15, description: 'Weekday 8PM - 12AM' },
  NIGHT: { type: 'night', multiplier: 1.25, description: '12AM - 6AM' },
  SATURDAY: { type: 'saturday', multiplier: 1.5, description: 'All day Saturday' },
  SUNDAY: { type: 'sunday', multiplier: 2.0, description: 'All day Sunday' },
  PUBLIC_HOLIDAY: { type: 'public_holiday', multiplier: 2.5, description: 'Public Holiday' }
};

const VALID_SHIFT_TIMES = Object.values(SHIFTS);

module.exports = { 
  SHIFTS, 
  SHIFT_LIST, 
  SHIFT_RATE_TYPES, 
  VALID_SHIFT_TIMES 
};
