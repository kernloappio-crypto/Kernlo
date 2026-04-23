import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tyzvhpyrghqayuqchwra.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';
    
    // Use createClient WITHOUT auto-session persistence
    // We manage JWT tokens manually in localStorage for mobile reliability
    supabaseInstance = createClient(url, key, {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    return supabaseInstance;
  } catch (error) {
    console.warn('Failed to initialize Supabase:', error);
    return null;
  }
}

export const supabase = getSupabaseClient() || ({} as SupabaseClient);
