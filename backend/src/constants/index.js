// Shifts
const SHIFTS = {
  MORNING: '7:00 AM - 3:00 PM',
  AFTERNOON: '3:00 PM - 11:00 PM',
  NIGHT: '11:00 PM - 7:00 AM',
  MORNING_ALT: '6:00 AM - 2:00 PM',
  AFTERNOON_ALT: '2:00 PM - 10:00 PM',
  NIGHT_ALT: '10:00 PM - 6:00 AM',
  SLEEPOVER: 'Sleepover'
};

const VALID_SHIFT_TIMES = Object.values(SHIFTS);

// Note Categories
const NOTE_CATEGORIES = [
  'Vital Signs',
  'Medication',
  'Behaviour',
  'Daily Activity',
  'Incident',
  'General'
];

// Trip Purposes
const TRIP_PURPOSES = [
  'Doctor Visit',
  'Therapy',
  'Community Access',
  'Shopping',
  'Other'
];

// Note Statuses
const NOTE_STATUSES = ['Draft', 'Review', 'Pending', 'Approved', 'Rejected', 'Locked', 'Consolidated', 'Submitted'];

// Trip Statuses
const TRIP_STATUSES = ['Pending', 'Approved', 'Rejected'];

// Rate Types (for assignments)
const RATE_TYPES = [
  'Standard',
  'Weekend',
  'Overnight',
  'Public Holiday',
  'Emergency',
  'Training'
];

module.exports = {
  SHIFTS,
  VALID_SHIFT_TIMES,
  NOTE_CATEGORIES,
  TRIP_PURPOSES,
  NOTE_STATUSES,
  TRIP_STATUSES,
  RATE_TYPES
};
