import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tyzvhpyrighqayuqchwra.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';
    supabaseInstance = createClient(url, key);
    return supabaseInstance;
  } catch (error) {
    console.warn('Failed to initialize Supabase:', error);
    return null;
  }
}

export const supabase = getSupabaseClient() || ({} as SupabaseClient);
