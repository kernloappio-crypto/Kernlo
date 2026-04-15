import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Fallback to working credentials for build-time; runtime will use real env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tyzvhpyrighqayuqchwra.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
