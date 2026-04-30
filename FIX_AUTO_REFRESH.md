# IMPLEMENTATION: Auto-Refresh Attendance Data

**Issue**: Attendance syncs to database but dashboards don't auto-refresh when user completes activity and navigates back.

**Solution**: Add page-focus listener to refetch attendance when user returns to dashboard.

---

## Fix #1: Parent Dashboard Auto-Refresh

**File**: `/app/dashboard/page.tsx`

**Location**: Add after the existing attendance loading useEffect (around line 313)

```javascript
// AUTO-REFRESH: When user returns to page, refetch attendance
useEffect(() => {
  const handleFocus = () => {
    console.log("🔄 Page focused, refreshing attendance...");
    
    if (kids.length === 0 || !userId) return;

    const loadAttendance = async () => {
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        const attendanceMap: { [kidName: string]: number } = {};
        for (const kid of kids) {
          try {
            const monthlyDays = await getAttendanceDaysMonthly(userId, kid.name, currentYear, currentMonth);
            attendanceMap[kid.name] = monthlyDays;
          } catch (e) {
            console.log(`⚠️ Could not load attendance for ${kid.name}`);
            attendanceMap[kid.name] = 0;
          }
        }
        setAttendanceMonthlyByKid(attendanceMap);
        console.log(`✅ Attendance refreshed: ${JSON.stringify(attendanceMap)}`);
      } catch (e) {
        console.log(`⚠️ Error refreshing attendance: ${e}`);
      }
    };

    loadAttendance();
  };

  // Listen for page focus (user returns to tab)
  window.addEventListener('focus', handleFocus);
  
  return () => window.removeEventListener('focus', handleFocus);
}, [kids, userId]);
```

---

## Fix #2: Kid Dashboard Auto-Refresh

**File**: `/app/dashboard/[id]/page.tsx`

**Location**: After existing useEffect (around line 299), add:

```javascript
// AUTO-REFRESH: Refetch attendance when page regains focus
useEffect(() => {
  const handleFocus = async () => {
    console.log(`🔄 Kid dashboard focused, refreshing attendance for ${kid?.name}...`);
    
    if (!userId || !kid?.name) return;

    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const yearlyDays = await getAttendanceDaysYearly(userId, kid.name, currentYear);
      setAttendanceDaysYear(yearlyDays);

      const monthlyDays = await getAttendanceDaysMonthly(userId, kid.name, currentYear, currentMonth);
      setAttendanceDaysMonth(monthlyDays);
      
      console.log(`✅ Kid dashboard attendance refreshed: ${monthlyDays} days this month, ${yearlyDays} this year`);
    } catch (err) {
      console.error("Error refreshing attendance on kid dashboard:", err);
    }
  };

  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, [userId, kid?.name]);
```

---

## Fix #3: Compliance Page Auto-Refresh

**File**: `/app/dashboard/[id]/compliance/page.tsx`

**Location**: After existing useEffect (around line 220), add:

```javascript
// AUTO-REFRESH: Refetch attendance when page regains focus
useEffect(() => {
  const handleFocus = async () => {
    console.log(`🔄 Compliance page focused, refreshing attendance for ${kid?.name}...`);
    
    if (!userId || !kid?.name) return;

    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const yearlyDays = await getAttendanceDaysYearly(userId, kid.name, currentYear);
      setAttendanceDaysYear(yearlyDays);

      const monthlyDays = await getAttendanceDaysMonthly(userId, kid.name, currentYear, currentMonth);
      setAttendanceDaysMonth(monthlyDays);

      const lastDates = await getLastAttendanceDates(userId, kid.name, 10);
      setLastAttendanceDates(lastDates);
      
      console.log(`✅ Compliance page attendance refreshed`);
    } catch (err) {
      console.error("Error refreshing attendance on compliance page:", err);
    }
  };

  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, [userId, kid?.name]);
```

---

## Alternative Fix: Manual Refresh Button

If page-focus listener isn't sufficient, add a refresh button to dashboards:

```javascript
// In parent dashboard (app/dashboard/page.tsx)
const [isRefreshing, setIsRefreshing] = useState(false);

const handleRefreshAttendance = async () => {
  setIsRefreshing(true);
  try {
    if (kids.length === 0 || !userId) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const attendanceMap: { [kidName: string]: number } = {};
    for (const kid of kids) {
      try {
        const monthlyDays = await getAttendanceDaysMonthly(userId, kid.name, currentYear, currentMonth);
        attendanceMap[kid.name] = monthlyDays;
      } catch (e) {
        attendanceMap[kid.name] = 0;
      }
    }
    setAttendanceMonthlyByKid(attendanceMap);
    console.log(`✅ Attendance refreshed`);
  } finally {
    setIsRefreshing(false);
  }
};

// Add button in header
<button
  onClick={handleRefreshAttendance}
  disabled={isRefreshing}
  style={{ backgroundColor: COLORS.secondary }}
  className="px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium text-sm disabled:opacity-50"
>
  {isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
</button>
```

---

## Testing the Fixes

### Test Case 1: Parent completes activity, stays on page
1. Parent on calendar, completes activity
2. Attendance inserted to database ✅
3. **BEFORE FIX**: Parent must refresh page to see update
4. **AFTER FIX**: Data auto-updates via page focus listener

### Test Case 2: Parent completes activity, switches apps
1. Parent in Kernlo, completes activity
2. Switches to another app (email, browser tab)
3. Returns to Kernlo
4. **BEFORE FIX**: Attendance still stale
5. **AFTER FIX**: `window.focus` event fires, data refreshes automatically ✅

### Test Case 3: Kid returns to dashboard from calendar
1. Child on calendar, parent completes activity
2. Child navigates back to dashboard
3. **BEFORE FIX**: Compliance card shows old attendance
4. **AFTER FIX**: Dashboard refetches on mount + focus event ✅

---

## Performance Considerations

- ✅ Page-focus listener only fires when user returns to page
- ✅ No continuous polling (battery efficient)
- ✅ Minimal DB queries (one per kid)
- ⚠️ Could debounce if multiple focus events fire rapidly

### Optional Debouncing

```javascript
let focusTimeout: NodeJS.Timeout;

const handleFocus = () => {
  // Debounce: only refresh after user focuses for 500ms
  clearTimeout(focusTimeout);
  focusTimeout = setTimeout(() => {
    loadAttendance();
  }, 500);
};

window.addEventListener('focus', handleFocus);
```

---

## Implementation Checklist

- [ ] Add page-focus listener to `/app/dashboard/page.tsx`
- [ ] Add page-focus listener to `/app/dashboard/[id]/page.tsx`
- [ ] Add page-focus listener to `/app/dashboard/[id]/compliance/page.tsx`
- [ ] Test: Complete activity, navigate back, verify attendance updates
- [ ] Test: Switch tabs/apps, return to Kernlo, verify attendance refreshes
- [ ] Optional: Add manual refresh buttons for better UX
- [ ] Optional: Add debouncing to prevent rapid refetches
- [ ] Add console logs for debugging

---

## Code Changes Summary

| File | Change | Lines |
|------|--------|-------|
| `/app/dashboard/page.tsx` | Add focus listener for attendance refresh | +25 |
| `/app/dashboard/[id]/page.tsx` | Add focus listener for attendance refresh | +25 |
| `/app/dashboard/[id]/compliance/page.tsx` | Add focus listener for attendance refresh | +25 |

**Total additions**: ~75 lines of code

---

## Expected Outcome

**Before Fix**:
```
1. Parent completes activity on 2026-05-01
2. Attendance logged to database ✅
3. Parent dashboard shows: "0 days" (stale)
4. User must press F5 to refresh
5. After refresh, shows: "1 day" ✅
```

**After Fix**:
```
1. Parent completes activity on 2026-05-01
2. Attendance logged to database ✅
3. Parent dashboard shows: "0 days"
4. User navigates back from calendar (or returns to tab)
5. `window.focus` event fires
6. useEffect refetches attendance
7. Parent dashboard shows: "1 day" ✅ (no manual refresh needed)
```

---

**Status**: Ready to implement  
**Priority**: High (critical for UX)  
**Effort**: Low (straightforward to add)
