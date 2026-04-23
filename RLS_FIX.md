# RLS Error Fix - Kernlo Mobile Dashboard

## Problem
✅ **Mobile login works** (session found in localStorage)  
✅ **Kids load successfully** (query passes RLS)  
❌ **Activities/Goals crash** with RLS policy error

**Root Cause:** 
- Session was stored to localStorage in `app/auth/login/page.tsx`
- Dashboard restored user from localStorage via `JSON.parse()`
- BUT: Supabase's `auth.uid()` was never reset after restore
- RLS policies check `auth.uid() = user_id`, which fails because `auth.uid()` is `null`

## Solution Implemented
**File:** `app/dashboard/page.tsx` (lines 115-128)

**What changed:**
```typescript
// Store the full session object
const backupSession = JSON.parse(backupSessionStr);
session = backupSession;
user = backupSession.user;

// NEW: Restore the session to Supabase's auth context
await supabase.auth.setSession(session);
```

**Why this works:**
1. `supabase.auth.setSession(session)` tells Supabase to use the restored session
2. This updates the internal auth state, making `auth.uid()` return the correct user ID
3. RLS policy `auth.uid() = user_id` now passes
4. Queries for kids, activities, goals all work

## Flow
1. **Login page** → stores `{ user, session }` to localStorage
2. **Dashboard page** → 
   - Reads from localStorage ✅
   - Calls `supabase.auth.setSession()` ← **CRITICAL FIX**
   - Makes queries (kids, activities, goals) ✅
   - RLS checks now pass ✅

## Testing
- Build: ✅ `npm run build` succeeds
- Mobile flow: Login → dashboard → all tables load
- No schema changes needed (RLS policies already correct)

## Why Fallback
- If `setSession()` fails, logs a warning
- If using sessionStorage only (no full session), redirects to login
- This prevents silently failing RLS checks

## Status
🟨 **READY FOR DEPLOYMENT**
- Build passes TypeScript
- No breaking changes
- Mobile login → dashboard flow fixed
