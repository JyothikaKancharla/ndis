# 🌍 Timezone Configuration Guide

## Overview
This project supports dynamic timezone switching between **Australia** and **India** without code changes. Simply update environment variables and restart.

---

## 📋 Files to Change Timezone

### 1. **Frontend** - [frontend/.env](./frontend/.env)
```bash
# Change this line:
REACT_APP_TIMEZONE=Australia/Sydney

# To this for India:
REACT_APP_TIMEZONE=Asia/Kolkata
```

**What this controls:**
- Date/time display format on all pages
- Shift status badges (Current/Pending/Previous)
- Relative date calculations (Today, Tomorrow, etc.)
- Note timestamps shown to users

---

### 2. **Backend** - [backend/.env](./backend/.env)
```bash
# Change this line:
TIMEZONE=Australia/Sydney

# To this for India:
TIMEZONE=Asia/Kolkata
```

**What this controls:**
- Assignment status calculations (Current/Pending/Previous)
- Date filtering in queries
- Shift time comparisons
- Note creation timestamps

---

## 🔄 How to Switch Timezones

### Step 1: Update Frontend Timezone
**File:** `frontend/.env`
```diff
- REACT_APP_TIMEZONE=Australia/Sydney
+ REACT_APP_TIMEZONE=Asia/Kolkata
```

### Step 2: Update Backend Timezone
**File:** `backend/.env`
```diff
- TIMEZONE=Australia/Sydney
+ TIMEZONE=Asia/Kolkata
```

### Step 3: Restart Services
```bash
# Kill and restart backend
npm start  # in backend/ folder

# Kill and restart frontend
npm start  # in frontend/ folder
```

---

## 🌐 Supported Timezones

| Timezone | Region | UTC Offset | Daylight Saving |
|----------|--------|-----------|-----------------|
| `Australia/Sydney` | 🇦🇺 Australia | UTC+10/+11 | Yes (Oct-Apr = +11) |
| `Asia/Kolkata` | 🇮🇳 India | UTC+5:30 | No (year-round) |

---

## 📍 Current Configuration

### For Australia (Default)
```
frontend/.env:   REACT_APP_TIMEZONE=Australia/Sydney
backend/.env:    TIMEZONE=Australia/Sydney
```

### For India
```
frontend/.env:   REACT_APP_TIMEZONE=Asia/Kolkata
backend/.env:    TIMEZONE=Asia/Kolkata
```

---

## 🔑 Key Files That Use Timezone Settings

### Frontend
- **[frontend/src/utils/shiftStatus.js](./frontend/src/utils/shiftStatus.js)**
  - `getConfiguredTime()` - Reads `REACT_APP_TIMEZONE`
  - `getAssignmentDateStatus()` - Uses configured timezone for comparisons
  - `getShiftStatus()` - Calculates shift status
  - `formatDateForDisplay()` - Formats dates in configured timezone

- **[frontend/.env](./frontend/.env)**
  - Sets `REACT_APP_TIMEZONE` env variable

### Backend
- **[backend/src/utils/assignmentStatus.js](./backend/src/utils/assignmentStatus.js)**
  - `getTZOffset()` - Reads `TIMEZONE` env variable
  - `nowInBusinessTZ()` - Gets current time in configured timezone
  - `toBusinessTZMidnight()` - Converts dates to configured timezone midnight
  - `calculateDynamicStatus()` - Calculates assignment status in configured timezone

- **[backend/.env](./backend/.env)**
  - Sets `TIMEZONE` env variable

---

## ⚙️ How It Works

### Frontend Logic
```javascript
// In shiftStatus.js
const getConfiguredTime = () => {
  const timezone = process.env.REACT_APP_TIMEZONE || 'Australia/Sydney';
  const utcDate = new Date();
  const timeString = utcDate.toLocaleString('en-US', { timeZone: timezone });
  return new Date(timeString);
};
```

### Backend Logic
```javascript
// In assignmentStatus.js
const getTZOffset = () => {
  const tz = process.env.TIMEZONE || 'Australia/Sydney';
  
  if (tz === 'Asia/Kolkata') {
    return 5.5 * 60 * 60 * 1000;  // IST
  }
  
  // Australia with daylight saving detection
  const now = new Date();
  const month = now.getUTCMonth();
  const isAEDT = month >= 9 || month <= 3;  // Oct-Mar
  return isAEDT ? 11 * 60 * 60 * 1000 : 10 * 60 * 60 * 1000;
};
```

---

## ✅ Checklist: Before Going Live

- [ ] Frontend `.env` has correct `REACT_APP_TIMEZONE`
- [ ] Backend `.env` has correct `TIMEZONE`
- [ ] Both set to the **same timezone**
- [ ] Backend restarted after `.env` change
- [ ] Frontend restarted after `.env` change
- [ ] Test shift status displays correctly
- [ ] Test note creation timestamps
- [ ] Test date filters in supervisor dashboard

---

## 🧪 Testing After Timezone Change

### Test Shift Status
1. Create a shift for today at current time
2. Check status shows "✅ CURRENT"
3. Verify time remaining is accurate

### Test Date Display
1. Go to Shifts page
2. Verify dates show in correct locale format
3. Relative dates (Today, Tomorrow) should be accurate

### Test Supervisor Dashboard
1. Filter by "Today"
2. Should only show today's assignments in configured timezone
3. Filter by "Week" should be correct for the timezone

---

## 🆘 Troubleshooting

### Shift status still wrong?
- [ ] Check both `.env` files are updated
- [ ] Verify servers were restarted
- [ ] Clear browser cache or hard refresh (Ctrl+Shift+R)

### Time is off by several hours?
- [ ] Ensure `TIMEZONE` matches `REACT_APP_TIMEZONE`
- [ ] Check that no hardcoded timezone is overriding the env variable

### Date display is wrong format?
- [ ] Verify `REACT_APP_TIMEZONE` is a valid timezone string
- [ ] Check browser console for timezone errors

---

## 📞 Quick Reference

| Task | Change File | Change Value |
|------|-------------|--------------|
| Switch to India | `frontend/.env` | `Asia/Kolkata` |
| Switch to India | `backend/.env` | `Asia/Kolkata` |
| Switch to Australia | `frontend/.env` | `Australia/Sydney` |
| Switch to Australia | `backend/.env` | `Australia/Sydney` |

---

**Last Updated:** March 9, 2026
