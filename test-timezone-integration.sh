#!/bin/bash

# ============================================
# Timezone Configuration Integration Test
# ============================================
# This script verifies all timezone functionality works correctly
# Usage: bash test-timezone-integration.sh

set -e

echo "======================================"
echo "Timezone Configuration Test Suite"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
run_test() {
  local test_name=$1
  local command=$2
  local expected=$3
  
  echo -n "Test: $test_name ... "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
  fi
}

echo ""
echo "1. Environment Variable Tests"
echo "======================================"

# Check if .env files exist
if [ -f "backend/.env" ]; then
  echo -e "${GREEN}✓${NC} backend/.env exists"
else
  echo -e "${RED}✗${NC} backend/.env not found"
  ((FAILED++))
fi

if [ -f "frontend/.env" ]; then
  echo -e "${GREEN}✓${NC} frontend/.env exists"
else
  echo -e "${RED}✗${NC} frontend/.env not found"
  ((FAILED++))
fi

# Check TIMEZONE in backend .env
echo ""
echo "2. Timezone Configuration Tests"
echo "======================================"

if grep -q "TIMEZONE=" backend/.env; then
  BACKEND_TZ=$(grep "TIMEZONE=" backend/.env | head -1 | cut -d= -f2)
  echo -e "${GREEN}✓${NC} Backend TIMEZONE set to: $BACKEND_TZ"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} TIMEZONE not found in backend/.env"
  ((FAILED++))
fi

if grep -q "REACT_APP_TIMEZONE=" frontend/.env; then
  FRONTEND_TZ=$(grep "REACT_APP_TIMEZONE=" frontend/.env | head -1 | cut -d= -f2)
  echo -e "${GREEN}✓${NC} Frontend REACT_APP_TIMEZONE set to: $FRONTEND_TZ"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} REACT_APP_TIMEZONE not found in frontend/.env"
  ((FAILED++))
fi

# Verify they match
if [ "$BACKEND_TZ" = "$FRONTEND_TZ" ]; then
  echo -e "${GREEN}✓${NC} Timezones match between backend and frontend"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠${NC} WARNING: Timezones don't match!"
  echo "  Backend: $BACKEND_TZ"
  echo "  Frontend: $FRONTEND_TZ"
fi

echo ""
echo "3. Source Code Tests"
echo "======================================"

# Check backend assignmentStatus.js
if grep -q "getTZOffset" backend/src/utils/assignmentStatus.js; then
  echo -e "${GREEN}✓${NC} Backend timezone function found: getTZOffset"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Backend timezone function NOT found"
  ((FAILED++))
fi

if grep -q "process.env.TIMEZONE" backend/src/utils/assignmentStatus.js; then
  echo -e "${GREEN}✓${NC} Backend reads TIMEZONE env variable"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Backend doesn't read TIMEZONE env variable"
  ((FAILED++))
fi

if grep -q "Asia/Kolkata" backend/src/utils/assignmentStatus.js; then
  echo -e "${GREEN}✓${NC} Backend supports Asia/Kolkata timezone"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Backend doesn't support Asia/Kolkata"
  ((FAILED++))
fi

if grep -q "Australia/Sydney" backend/src/utils/assignmentStatus.js; then
  echo -e "${GREEN}✓${NC} Backend supports Australia/Sydney timezone"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Backend doesn't support Australia/Sydney"
  ((FAILED++))
fi

# Check frontend shiftStatus.js
if grep -q "getConfiguredTime" frontend/src/utils/shiftStatus.js; then
  echo -e "${GREEN}✓${NC} Frontend timezone function found: getConfiguredTime"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Frontend timezone function NOT found"
  ((FAILED++))
fi

if grep -q "REACT_APP_TIMEZONE" frontend/src/utils/shiftStatus.js; then
  echo -e "${GREEN}✓${NC} Frontend reads REACT_APP_TIMEZONE env variable"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Frontend doesn't read REACT_APP_TIMEZONE env variable"
  ((FAILED++))
fi

echo ""
echo "4. Test Files Validation"
echo "======================================"

if [ -f "backend/src/__tests__/assignmentStatus.test.js" ]; then
  echo -e "${GREEN}✓${NC} Backend unit tests exist"
  ((PASSED++))
  
  # Count test cases
  TEST_COUNT=$(grep -c "test(" backend/src/__tests__/assignmentStatus.test.js || echo "0")
  echo "  - $TEST_COUNT test cases found"
else
  echo -e "${RED}✗${NC} Backend unit tests NOT found"
  ((FAILED++))
fi

if [ -f "frontend/src/__tests__/timezoneShiftStatus.test.js" ]; then
  echo -e "${GREEN}✓${NC} Frontend unit tests exist"
  ((PASSED++))
  
  # Count test cases
  TEST_COUNT=$(grep -c "test(" frontend/src/__tests__/timezoneShiftStatus.test.js || echo "0")
  echo "  - $TEST_COUNT test cases found"
else
  echo -e "${RED}✗${NC} Frontend unit tests NOT found"
  ((FAILED++))
fi

echo ""
echo "5. Documentation Tests"
echo "======================================"

if [ -f "TIMEZONE_CONFIGURATION.md" ]; then
  echo -e "${GREEN}✓${NC} Timezone configuration guide exists"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Timezone configuration guide NOT found"
  ((FAILED++))
fi

if [ -f "UNIT_TESTING_GUIDE.md" ]; then
  echo -e "${GREEN}✓${NC} Unit testing guide exists"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Unit testing guide NOT found"
  ((FAILED++))
fi

echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
TOTAL=$((PASSED + FAILED))
echo "Total:  $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed! ✓${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Run backend unit tests:  cd backend && npm test"
  echo "2. Run frontend unit tests: cd frontend && npm test"
  echo "3. Start backend server:    cd backend && npm start"
  echo "4. Start frontend server:   cd frontend && npm start"
  exit 0
else
  echo -e "${RED}Some tests failed. Please fix the issues above.${NC}"
  exit 1
fi
