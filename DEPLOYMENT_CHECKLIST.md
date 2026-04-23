# Kernlo Mobile Dashboard - RLS Fix Deployment Checklist

## Issue Summary
Mobile dashboard crashed on Activities/Goals load with RLS policy error after login.

**Symptom:**
```
Kids: ✅ 2 loaded
Activities: ❌ RLS policy error (missing auth.uid())
Goals: ❌ RLS policy error (missing auth.uid())
```

## Root Cause Analysis
1. **Login page** stores full session to `localStorage` ✅
2. **Dashboard page** restored user from localStorage ✅
3. **BUT:** Never restored session to Supabase's auth context ❌
4. **RLS queries** check `auth.uid() = user_id`, which fails because `auth.uid()` returns `null` ❌

## Fix Applied
**File:** `app/dashboard/page.tsx` (line 125)

Added **one critical line:**
```typescript
await supabase.auth.setSession(session);
```

This restores the session to Supabase's auth context so that:
- `auth.uid()` returns the correct user ID
- RLS policies pass `auth.uid() = user_id` checks
- All table queries (kids, activities, goals) work

## Verification
✅ **Builds:** `npm run build` succeeds (TypeScript + Next.js build)
✅ **No schema changes:** RLS policies already correct
✅ **Backward compatible:** Falls back to desktop flow (getSession)
✅ **Graceful failures:** Logs warnings and redirects to login if session restore fails

## Deployment Steps
1. Pull latest code
2. Run `npm install` (no new dependencies)
3. Run `npm run build` (should complete in ~14s)
4. Deploy to Vercel or your hosting
5. Test mobile flow: **Login → Dashboard → All sections load**

## Expected Behavior After Fix
**Desktop:**
1. User logs in
2. Session stored in Supabase + localStorage
3. Dashboard loads, calls getSession() (desktop auth context preserved)
4. All queries pass RLS checks ✅

**Mobile (localStorage only):**
1. User logs in
2. Session stored to localStorage (Supabase SDK auto-persists + backup in localStorage)
3. Dashboard loads, reads from localStorage
4. **NEW:** Restores session to Supabase auth context via `setSession()`
5. All queries pass RLS checks ✅
6. On refresh/re-entry, localStorage persists, session auto-restores

## Rollback Plan
If issues arise:
1. Revert `app/dashboard/page.tsx` to remove `setSession()` call
2. Re-deploy
3. Users must log in again

## Status
🟨 **READY FOR IMMEDIATE DEPLOYMENT**
- Build passes
- Fix is minimal (1 line of code)
- Launch is TODAY
