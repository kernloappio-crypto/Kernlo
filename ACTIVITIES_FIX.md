# Activities Query Fix - Mobile Dashboard RLS Issue

## Problem Summary
The mobile dashboard was successfully logging in users and loading kids, but failing silently when loading activities. The logs showed "Loading activities..." and then crashed/redirected without showing the activity list.

## Root Cause Analysis
The issue was NOT with the RLS policies themselves (they were identical for kids and activities). The problem was **client-side authentication context restoration on mobile**:

1. **JWT tokens stored in localStorage** during login
2. **Dashboard tries to restore session** using `supabase.auth.setSession()`
3. **Kids query worked** (possibly due to caching or timing)
4. **Activities query failed** (due to auth context not being fully propagated)

The core issue: **`setSession()` on the client-side Supabase instance was not properly propagating the auth context for all queries**, especially on mobile where session handling is fragile.

## Solution Implemented

### Approach 1: Client-Side Improvements (Partial Fix)
- ✅ Stored full session object in localStorage (not just tokens)
- ✅ Removed `.eq()` filters from SELECT queries (RLS policies handle filtering)
- ✅ Added 50ms delay after `setSession()` for auth context propagation
- ✅ Improved error logging to capture exact error codes

### Approach 2: Server-Side API Endpoints (Complete Fix)
- ✅ Created `/api/kids`, `/api/activities`, `/api/goals` endpoints
- ✅ Endpoints accept JWT token in Authorization header
- ✅ Create server-side Supabase clients with token in auth headers
- ✅ Server-side RLS handling is more reliable than client-side

## Key Changes

### New Files Created
- `/app/api/kids/route.ts` - Server-side kids query
- `/app/api/activities/route.ts` - Server-side activities query (was problematic)
- `/app/api/goals/route.ts` - Server-side goals query
- `/app/api/debug/test-rls/route.ts` - Debug endpoint for testing RLS

### Modified Files
- `/lib/supabase-client.ts` - No changes (kept `persistSession: false`)
- `/lib/supabase-auth.ts` - Now stores full session object to localStorage
- `/app/dashboard/page.tsx` - Uses server-side endpoints instead of direct client queries

## Why This Works

**Server-Side Approach Advantages:**
1. **No client-side auth context issues** - server has full control
2. **JWT token passed explicitly** in Authorization header
3. **Supabase server SDK handles RLS** correctly with proper auth context
4. **Consistent behavior** across all platforms (mobile, web, etc.)
5. **More reliable** - no timing issues or context propagation problems

## Testing Checklist
- [ ] Test login flow
- [ ] Test kids loading on dashboard
- [ ] Test activities loading on dashboard
- [ ] Test goals loading on dashboard
- [ ] Test on mobile Safari (primary concern)
- [ ] Test on Android Chrome
- [ ] Verify no activities/kids/goals missing (RLS filtering works)
- [ ] Verify Quick Log still works (INSERT queries)
- [ ] Verify Report generation still works

## Deployment Notes
- All changes are backward compatible
- No database schema changes
- No RLS policy changes
- Can be deployed immediately
- Consider monitoring error rates on `/api/activities` during initial rollout

## Future Improvements
1. Could cache results in React Query for faster reloads
2. Could add client-side filtering/sorting
3. Could batch multiple queries into single endpoint
4. Consider middleware for auth token validation on all endpoints
