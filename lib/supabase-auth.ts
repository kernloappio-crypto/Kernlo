import { supabase } from './supabase-client';

/**
 * Supabase Auth Utilities
 * Replaces localStorage-based auth with real Supabase authentication
 */

export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Signup error:', error.message);
      return { success: false, error: error.message };
    }

    // Create user record in users table
    if (data.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          trial_start_date: new Date().toISOString(),
          trial_ended: false,
          is_paid: false,
          email_verified: false,
        });

      if (userError) {
        console.error('User creation error:', userError.message);
        return { success: false, error: userError.message };
      }
    }

    return { success: true, user: data.user };
  } catch (err) {
    console.error('Unexpected signup error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, session: data.session };
  } catch (err) {
    console.error('Unexpected login error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

export async function signOut() {
  try {
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

export function onAuthStateChange(
  callback: (user: any | null, session: any | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null, session);
  });
}
