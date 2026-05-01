#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tyzvhpyrghqayuqchwra.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRawSQL() {
  console.log('🔧 Attempting to run raw SQL...\n');

  const sql = `
    ALTER TABLE activities 
    ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
    
    ALTER TABLE extracurricular_activities 
    ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
    
    ALTER TABLE field_trips 
    ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
    
    CREATE INDEX IF NOT EXISTS idx_activities_is_completed 
      ON activities(is_completed);
    
    CREATE INDEX IF NOT EXISTS idx_extracurricular_is_completed 
      ON extracurricular_activities(is_completed);
    
    CREATE INDEX IF NOT EXISTS idx_field_trips_is_completed 
      ON field_trips(is_completed);
  `;

  try {
    // Attempt to run via rpc (if available)
    console.log('Attempting via RPC call...');
    const { data, error } = await supabase.rpc('sql', { sql });
    
    if (error) {
      console.error('❌ RPC Error:', error);
    } else {
      console.log('✅ Migration executed:', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.log('\n⚠️ Cannot execute DDL with anon key.');
    console.log('Need to run migration manually in Supabase dashboard.');
  }
}

testRawSQL();
