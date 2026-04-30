# 🔴 CRITICAL FIX: Attendance Logging Not Working

## Root Cause Found

The issue is a **RACE CONDITION** in `ensureAuthContext()`.

### The Problem

In `lib/supabase-data.ts`, the `ensureAuthContext()` function:

```typescript
const { data, error } = await supabase.auth.setSession(savedSession);

if (error) {
  console.warn('⚠️ Failed to restore session:', error.message);
  return;  // Silently returns!
}
```

**Issue 1:** If `setSession()` fails, it just logs a warning and continues. The `logAttendance()` function then tries to insert without valid auth, and the RLS policy blocks it.

**Issue 2:** Even if `setSession()` succeeds, there's no guarantee the auth context is propagated to subsequent queries before `logAttendance()` continues.

**Issue 3:** The session in localStorage might have:
- Expired tokens
- Incomplete format
- Missing refresh_token field

### The Fix

Replace `ensureAuthContext()` with a robust version that:
1. Actually verifies the session was set successfully
2. Waits for auth context to be ready
3. Handles token refresh if needed
4. Throws clear errors if auth fails

## Solution

Replace the `ensureAuthContext()` function in `lib/supabase-data.ts` with:

```typescript
/**
 * Ensure auth session is restored on the supabase client
 * This is critical for RLS policies to work (auth.uid() must be set)
 * Called before every sensitive database operation
 */
export async function ensureAuthContext() {
  try {
    if (typeof window === 'undefined') return;
    
    // Step 1: Check if auth is already set on client
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (currentSession && currentSession.access_token) {
      // Check if token is expired
      try {
        const parts = currentSession.access_token.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          const now = Math.floor(Date.now() / 1000);
          
          if (decoded.exp && decoded.exp > now) {
            console.log('✅ Auth context already set with valid token');
            return true;
          } else {
            console.log('⚠️  Current token expired, attempting refresh');
          }
        }
      } catch (e) {
        // Continue anyway
      }
    }
    
    // Step 2: Try to restore from localStorage
    const sessionStr = localStorage.getItem('kernlo_session');
    if (!sessionStr) {
      console.warn('⚠️ No kernlo_session in localStorage - user may not be logged in');
      return false;
    }
    
    let savedSession;
    try {
      savedSession = JSON.parse(sessionStr);
    } catch (e) {
      console.warn('⚠️ Could not parse session from localStorage:', e);
      return false;
    }
    
    // Validate session has required fields
    if (!savedSession.access_token) {
      console.warn('⚠️ Session missing access_token');
      return false;
    }
    
    // Check if token is expired, try to refresh
    try {
      const parts = savedSession.access_token.split('.');
      if (parts.length === 3) {
        const decoded = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        if (decoded.exp && decoded.exp < now) {
          console.log('⚠️ Stored token expired, attempting refresh...');
          
          if (!savedSession.refresh_token) {
            console.warn('⚠️ Cannot refresh: no refresh_token in session');
            return false;
          }
          
          // Try to refresh the token
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: savedSession.refresh_token,
          });
          
          if (refreshError) {
            console.warn('⚠️ Token refresh failed:', refreshError.message);
            return false;
          }
          
          if (refreshData.session) {
            // Update stored session
            localStorage.setItem('kernlo_session', JSON.stringify(refreshData.session));
            savedSession = refreshData.session;
            console.log('✅ Token refreshed successfully');
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Token validation/refresh error:', e);
      // Continue anyway with stored token
    }
    
    // Step 3: Set session on Supabase client
    const { data, error } = await supabase.auth.setSession(savedSession);
    
    if (error) {
      console.error('❌ Failed to set auth session:', error.message);
      console.error('Session details:', {
        hasAccessToken: !!savedSession.access_token,
        hasRefreshToken: !!savedSession.refresh_token,
        hasUser: !!savedSession.user,
      });
      return false;
    }
    
    // Verify session was actually set
    if (!data.session) {
      console.warn('⚠️ setSession returned no session data');
      return false;
    }
    
    console.log('✅ Auth context set successfully for user:', data.session.user?.id);
    
    // Give Supabase a moment to register the auth context
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return true;
    
  } catch (err) {
    console.error('⚠️ ensureAuthContext error:', err);
    return false;
  }
}
```

Then update `logAttendance()` to check the return value:

```typescript
export async function logAttendance(userId: string, childName: string, date: string) {
  // Ensure auth session is set on client for RLS policy to work
  const authReady = await ensureAuthContext();
  
  if (!authReady) {
    throw new Error('Failed to authenticate: session could not be restored. Please refresh the page and try again.');
  }
  
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      user_id: userId,
      child_name: childName,
      schooling_date: date,
    })
    .select();

  if (error) {
    // Check if it's a unique constraint violation (duplicate entry)
    if (error.code === '23505' || error.message?.includes('duplicate')) {
      console.log('Attendance already exists for this date, returning existing record');
      // Fetch and return existing record
      const { data: existing } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('child_name', childName)
        .eq('schooling_date', date)
        .single();
      return existing;
    }
    
    console.error('logAttendance error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      userId,
      childName,
      date,
    });
    throw new Error(`Failed to log attendance: ${error.message}`);
  }
  return data?.[0];
}
```

## Implementation Steps

1. Edit `/data/.openclaw/workspace/kernlo/lib/supabase-data.ts`
2. Find and replace the `ensureAuthContext()` function with the improved version above
3. Update the `logAttendance()` function to check the return value
4. Test:
   - Parent opens calendar
   - Parent clicks "Complete" on an activity
   - Check browser console for auth context success/failure
   - Go to Compliance page and refresh
   - Attendance should appear

## Verification

After fix, when parent completes an activity, browser console should show:
```
✅ Auth context set successfully for user: [user-id]
✅ Attendance logged
```

Instead of:
```
⚠️ Failed to restore session: ...
```
