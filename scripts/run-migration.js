#!/usr/bin/env node

/**
 * Migration Runner Script for Kernlo
 * This script applies SQL migrations to the Supabase database
 */

const fs = require('fs');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('🔧 Initializing Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/014_add_sms_notifications.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📝 Migration SQL:');
  console.log('─'.repeat(80));
  console.log(migrationSQL);
  console.log('─'.repeat(80));

  try {
    console.log('\n⏳ Applying migration...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      throw new Error(`Supabase RPC error: ${error.message}`);
    }

    console.log('✅ Migration applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error applying migration:');
    console.error(err.message);
    console.error('\n⚠️  Manual Fix:');
    console.error('Go to https://app.supabase.com → SQL Editor → New Query');
    console.error('Copy-paste the migration SQL above and run it.');
    process.exit(1);
  }
}

runMigration();
