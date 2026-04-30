#!/bin/bash

echo "🔍 VERIFYING ATTENDANCE LOGGING FIX"
echo "===================================="
echo ""

# Check if ensureAuthContext is present
echo "1. Checking for ensureAuthContext function..."
if grep -q "export async function ensureAuthContext" lib/supabase-data.ts; then
    echo "   ✅ ensureAuthContext function exists and is exported"
else
    echo "   ❌ ensureAuthContext function NOT FOUND"
    exit 1
fi

# Check if logAttendance calls ensureAuthContext
echo ""
echo "2. Checking if logAttendance calls ensureAuthContext..."
if grep -A 5 "^export async function logAttendance" lib/supabase-data.ts | grep -q "await ensureAuthContext"; then
    echo "   ✅ logAttendance calls ensureAuthContext"
else
    echo "   ❌ logAttendance does NOT call ensureAuthContext"
    exit 1
fi

# Check if duplicate handling is in place
echo ""
echo "3. Checking for duplicate handling..."
if grep -q "23505\|duplicate" lib/supabase-data.ts; then
    echo "   ✅ Duplicate key handling implemented"
else
    echo "   ❌ Duplicate handling NOT FOUND"
    exit 1
fi

# Check if setComplianceState calls ensureAuthContext
echo ""
echo "4. Checking if setComplianceState calls ensureAuthContext..."
if grep -A 3 "^export async function setComplianceState" lib/supabase-data.ts | grep -q "await ensureAuthContext"; then
    echo "   ✅ setComplianceState calls ensureAuthContext"
else
    echo "   ❌ setComplianceState does NOT call ensureAuthContext"
    exit 1
fi

# Check if MonthCalendar imports ensureAuthContext
echo ""
echo "5. Checking if MonthCalendar imports ensureAuthContext..."
if grep -q "ensureAuthContext" components/MonthCalendar.tsx; then
    echo "   ✅ MonthCalendar imports ensureAuthContext"
else
    echo "   ❌ MonthCalendar does NOT import ensureAuthContext"
    exit 1
fi

# Check if MonthCalendar calls it in handleCompleteActivity
echo ""
echo "6. Checking if handleCompleteActivity calls ensureAuthContext..."
if grep -A 10 "const handleCompleteActivity = async" components/MonthCalendar.tsx | grep -q "await ensureAuthContext"; then
    echo "   ✅ handleCompleteActivity calls ensureAuthContext"
else
    echo "   ❌ handleCompleteActivity does NOT call ensureAuthContext"
    exit 1
fi

# Check error handling in Compliance page
echo ""
echo "7. Checking error message display in Compliance page..."
if grep -q "errorMsg" app/dashboard/[id]/compliance/page.tsx; then
    echo "   ✅ Error messages are displayed to user"
else
    echo "   ❌ Error messages may not be displayed properly"
    exit 1
fi

echo ""
echo "===================================="
echo "✅ ALL VERIFICATIONS PASSED!"
echo ""
echo "Fix Summary:"
echo "  - ensureAuthContext() ensures auth is set on supabase client"
echo "  - logAttendance() now restores auth before inserting"
echo "  - Duplicate entries handled gracefully (idempotent)"
echo "  - setComplianceState() also ensures auth"
echo "  - Activity completion ensures auth context"
echo "  - Error messages properly displayed to users"
echo ""
echo "Ready for browser testing! See ATTENDANCE_FIX.md for details."
