#!/usr/bin/env node

/**
 * Database migration application script
 * Applies pending migrations to Supabase PostgreSQL
 */

const fs = require('fs');
const path = require('path');

// For Supabase, we'd need the service role key
// Get it from: https://app.supabase.com/project/[project-id]/settings/api
// Or use the SQL Editor in Supabase Dashboard to manually run the migration

const migrationPath = path.join(__dirname, 'supabase/migrations/006_add_activity_type.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('Migration to apply:');
console.log('==================');
console.log(migrationSQL);
console.log('\n==================');
console.log('\nTo apply this migration:');
console.log('\n1. Go to: https://app.supabase.com/project/[project-id]/sql');
console.log('2. Create a new query');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run" to execute');
console.log('\nAlternatively, use Supabase CLI:');
console.log('  supabase db push');
