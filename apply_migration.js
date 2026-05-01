#!/usr/bin/env node

/**
 * Apply missing is_completed columns to activity tables
 * This uses Node.js to execute raw SQL via Supabase API
 */

const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://tyzvhpyrghqayuqchwra.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';

// Note: We need the SERVICE_ROLE_KEY to execute DDL operations
// This script shows what needs to be run - typically in Supabase SQL Editor

const SQL = `
-- Add is_completed columns to all three activity tables
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE extracurricular_activities 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE field_trips 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_is_completed 
  ON activities(is_completed);

CREATE INDEX IF NOT EXISTS idx_extracurricular_is_completed 
  ON extracurricular_activities(is_completed);

CREATE INDEX IF NOT EXISTS idx_field_trips_is_completed 
  ON field_trips(is_completed);

-- Verify
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('activities', 'extracurricular_activities', 'field_trips')
  AND column_name = 'is_completed'
ORDER BY table_name;
`;

console.log('❌ This script cannot execute DDL without SERVICE_ROLE_KEY');
console.log('\n📝 To fix the Complete button, you need to:');
console.log('\n1. Go to Supabase Dashboard: https://app.supabase.com/');
console.log('2. Select your project (tyzvhpyrghqayuqchwra)');
console.log('3. Click "SQL Editor" on the left sidebar');
console.log('4. Click "+ New Query"');
console.log('5. Paste this SQL:');
console.log('\n' + SQL);
console.log('\n6. Click "Run"');
console.log('\n7. Verify the results show 3 rows');
console.log('\n8. Refresh the Kernlo app and test the Complete button');

process.exit(0);
