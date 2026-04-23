import { supabase } from './supabase-client';

/**
 * Supabase Auth Utilities
 * Uses Supabase Auth (built-in) instead of custom users table
 */

export async function signUp(email: string, password: string) {
  try {
    console.log('signUp called with email:', email);
    
    if (!supabase || !supabase.auth) {
      const msg = 'Supabase not initialized';
      console.error(msg);
      return { success: false, error: msg };
    }

    console.log('Calling supabase.auth.signUp...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log('signUp response:', { error: error?.message, userId: data.user?.id });

    if (error) {
      console.error('Signup error:', error.message);
      return { success: false, error: error?.message || 'Signup failed' };
    }

    // Supabase returns user even if email confirmation required
    if (data.user) {
      console.log('✅ Signup successful. User created:', data.user.id);
      // NOTE: User must verify email before they can sign in with password
      // The email confirmation is required by Supabase auth config
      return { success: true, user: data.user };
    }

    console.log('No user in response');
    return { success: false, error: 'Signup did not return user data' };
  } catch (err: any) {
    console.error('❌ Catch error in signUp:', err?.message || err);
    return { success: false, error: err?.message || 'Unexpected error' };
  }
}

export async function signIn(email: string, password: string) {
  try {
    if (!supabase || !supabase.auth) {
      return { success: false, error: 'Supabase not initialized. Please check your configuration.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return { success: false, error: error?.message || 'Login failed' };
    }

    // Extract tokens and session from response
    if (data.session) {
      const accessToken = data.session.access_token;
      const refreshToken = data.session.refresh_token;
      
      // Store BOTH tokens and full session object to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('kernlo_access_token', accessToken);
          localStorage.setItem('kernlo_refresh_token', refreshToken);
          // Also store the full session for easier restoration
          localStorage.setItem('kernlo_session', JSON.stringify(data.session));
          console.log('✅ Tokens and session stored to localStorage');
        } catch (e) {
          console.warn('⚠️ Could not store tokens:', e);
        }
      }
    }

    return { success: true, session: data.session, tokens: { accessToken: data.session?.access_token, refreshToken: data.session?.refresh_token } };
  } catch (err) {
    console.error('Unexpected login error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

export async function signOut() {
  try {
    // Clear tokens and session from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('kernlo_access_token');
        localStorage.removeItem('kernlo_refresh_token');
        localStorage.removeItem('kernlo_session');
        localStorage.removeItem('kernlo_session_backup');
        console.log('✅ Tokens and session cleared from localStorage');
      } catch (e) {
        console.warn('⚠️ Could not clear tokens:', e);
      }
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Unexpected logout error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      console.error('Password reset error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected password reset error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

export async function getCurrentUser() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}

export async function getSession() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (err) {
    console.error('Error getting session:', err);
    return null;
  }
}

/**
 * Helper: Restore Supabase auth session from JWT token in localStorage
 * Called once on app init to validate token and set up client
 */
export async function restoreAuthFromToken() {
  try {
    if (typeof window === 'undefined') return null;
    
    const accessToken = localStorage.getItem('kernlo_access_token');
    const refreshToken = localStorage.getItem('kernlo_refresh_token');
    
    if (!accessToken) {
      console.log('No JWT token found in localStorage');
      return null;
    }
    
    // Validate token is not expired
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const decoded = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        if (decoded.exp && decoded.exp < now) {
          console.log('Access token expired');
          // Try to refresh if refresh token exists
          if (refreshToken) {
            const { data, error } = await supabase.auth.refreshSession({ 
              refresh_token: refreshToken 
            });
            if (!error && data.session) {
              localStorage.setItem('kernlo_access_token', data.session.access_token);
              localStorage.setItem('kernlo_refresh_token', data.session.refresh_token);
              console.log('✅ Token refreshed');
              return data.session;
            }
          }
          return null;
        }
        
        console.log('✅ Token is valid');
        return { access_token: accessToken, refresh_token: refreshToken };
      }
    } catch (e) {
      console.error('Token validation error:', e);
      return null;
    }
  } catch (err) {
    console.error('Error restoring auth:', err);
    return null;
  }
}
