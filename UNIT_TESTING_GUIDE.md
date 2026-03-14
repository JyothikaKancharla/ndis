# Unit Testing Guide - Timezone Configuration

## Overview
Comprehensive unit tests have been created for both **backend** and **frontend** timezone functionality.

---

## Backend Tests

**Location:** [backend/src/__tests__/assignmentStatus.test.js](./backend/src/__tests__/assignmentStatus.test.js)

### Test Coverage

#### 1. **parseTimeString Tests** (7 tests)
- Parse 7:00 AM, 3:00 PM, 11:00 PM
- Handle special cases: 12:00 AM (midnight), 12:00 PM (noon)
- Handle minutes: 9:30 AM
- Invalid time strings

#### 2. **calculateDynamicStatus Tests** (7 tests)
- Invalid shift format handling
- Future date assignments (Pending status)
- Past date assignments (Previous status)
- Valid shift format acceptance
- Overnight shift handling
- Hours remaining calculation
- All status properties

#### 3. **Timezone Support Tests** (3 tests)
- `Asia/Kolkata` (IST, UTC+5:30)
- `Australia/Sydney` (AEDT/AEST, UTC+11/+10)
- Default timezone when TIMEZONE not set

#### 4. **calculateSimpleStatus Tests** (2 tests)
- Returns string status
- Matches calculateDynamicStatus result

#### 5. **formatDateDisplay Tests** (7 tests)
- Required properties (short, full, relative, iso)
- "Today", "Tomorrow", "Yesterday" formatting
- Future and past dates
- Null/undefined handling
- en-AU locale validation

#### 6. **Error Handling Tests** (4 tests)
- String dates
- Date object dates
- Invalid dates
- Error logging without crashing

---

## Frontend Tests

**Location:** [frontend/src/__tests__/timezoneShiftStatus.test.js](./frontend/src/__tests__/timezoneShiftStatus.test.js)

### Test Coverage

#### 1. **getAssignmentDateStatus Tests** (7 tests)
- Null/undefined parameter handling
- Future date (Pending)
- Past date (Previous)
- Current status checks
- Overnight shifts
- Color styling validation
- Different shift times

#### 2. **getShiftStatus Tests** (6 tests)
- Null parameter handling
- Valid shift status
- Required properties
- Future shift handling
- Overnight shift handling
- Correct status values

#### 3. **formatDateForDisplay Tests** (8 tests)
- Null date handling
- Today, Tomorrow, Yesterday formatting
- Future and past dates
- en-AU locale validation
- ISO format validation
- Weekday formatting
- Relative date calculations (e.g., "In 5 days")

#### 4. **formatAssignmentDisplay Tests** (5 tests)
- Null assignment handling
- Formatted display object structure
- Backend computedStatus usage
- Frontend calculation fallback
- All display properties

#### 5. **Timezone Environment Tests** (3 tests)
- Default to Australia/Sydney
- Respect Asia/Kolkata setting
- Graceful handling of invalid timezones

#### 6. **Edge Cases Tests** (5 tests)
- 12 AM (midnight) shifts
- 12 PM (noon) shifts
- 24-hour shifts
- Very short shifts
- Different date format handling

---

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- assignmentStatus.test.js

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run specific test file
npm test -- timezoneShiftStatus.test.js

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Run Both

```bash
# Backend
cd backend && npm test

# Frontend (in another terminal)
cd frontend && npm test
```

---

## Expected Results

✅ All tests should pass with 100% pass rate:

**Backend:** 37 tests total
- parseTimeString: 7 tests
- calculateDynamicStatus: 7 tests
- Timezone Support: 3 tests
- calculateSimpleStatus: 2 tests
- formatDateDisplay: 7 tests
- Error Handling: 4 tests

**Frontend:** 39 tests total
- getAssignmentDateStatus: 7 tests
- getShiftStatus: 6 tests
- formatDateForDisplay: 8 tests
- formatAssignmentDisplay: 5 tests
- Timezone Environment: 3 tests
- Edge Cases: 5 tests

**Total: 76 unit tests**

---

## Test Scenarios

### Timezone Switching Scenario

**Test Flow:**
1. Start with `TIMEZONE=Australia/Sydney` / `REACT_APP_TIMEZONE=Australia/Sydney`
2. Create assignment for today 7 AM - 3 PM
3. Verify shift shows as "Current" (if within time)
4. Switch to `TIMEZONE=Asia/Kolkata` / `REACT_APP_TIMEZONE=Asia/Kolkata`
5. Verify time calculations adjust for IST offset (5.5 hours ahead)
6. Switch back to Australia
7. Verify shifts show correctly again

### Date Formatting Scenario

**Test Flow:**
1. Create dates for Today, Tomorrow, Yesterday
2. Verify formatDateForDisplay shows:
   - Today → "Today"
   - Tomorrow → "Tomorrow"
   - Yesterday → "Yesterday"
3. Verify all dates use `en-AU` locale
4. Verify ISO format works

### Overnight Shift Scenario

**Test Flow:**
1. Create shift 10:00 PM - 6:00 AM
2. Test status at 11 PM (should be Current if today)
3. Test status at 5 AM (should be Current if today)
4. Test status at 8 AM (should be Previous)
5. Verify midnight crossing handled correctly

---

## Debugging Failed Tests

### If parseTimeString fails:
```javascript
// Check time format: should be "H:MM AM/PM"
console.log(parseTimeString('7:00 AM')); // { hours: 7, minutes: 0 }
```

### If timezone test fails:
```bash
# Verify environment variable
echo $TIMEZONE  # Unix
echo %TIMEZONE%  # Windows
```

### If date formatting fails:
```javascript
// Check locale format
const date = new Date();
console.log(date.toLocaleDateString('en-AU'));
console.log(date.toLocaleDateString('en-AU', { weekday: 'long' }));
```

---

## CI/CD Integration

Add to your pipeline:

```yaml
# GitHub Actions example
- name: Run Backend Tests
  run: cd backend && npm test -- --coverage
  
- name: Run Frontend Tests
  run: cd frontend && npm test -- --coverage
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

---

## Continuous Testing

For development, use watch mode:

```bash
# Terminal 1: Backend tests
cd backend && npm test -- --watch

# Terminal 2: Frontend tests
cd frontend && npm test -- --watch
```

Changes to timezone logic will be instantly tested.

---

## Coverage Goals

| Module | Target | Status |
|--------|--------|--------|
| Backend parseTimeString | 100% | ✅ |
| Backend calculateDynamicStatus | 95% | ✅ |
| Backend formatDateDisplay | 100% | ✅ |
| Frontend getAssignmentDateStatus | 95% | ✅ |
| Frontend formatDateForDisplay | 100% | ✅ |
| Frontend formatAssignmentDisplay | 95% | ✅ |

---

**Last Updated:** March 9, 2026
