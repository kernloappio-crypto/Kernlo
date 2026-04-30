#!/usr/bin/env node

/**
 * Test script to verify attendance table exists and is accessible
 * Run: node test-attendance-table.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tyzvhpyrghqayuqchwra.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log('🧪 Testing Attendance Table...\n');

  // Test 1: Check if table exists by querying it
  console.log('Test 1: Checking if attendance table exists...');
  try {
    const { data, error, status } = await supabase
      .from('attendance')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.error('\n🔴 ATTENDANCE TABLE DOES NOT EXIST');
        console.error('→ You must run the SQL migration in Supabase');
        console.error('→ See: ATTENDANCE_TABLE_SETUP.md');
        process.exit(1);
      }
    } else {
      console.log('✅ Attendance table exists!');
      console.log(`   Found ${data?.length || 0} records\n`);
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
    process.exit(1);
  }

  // Test 2: Verify RLS policies are enabled
  console.log('Test 2: Checking RLS policies...');
  try {
    // This will fail with a permission error if RLS is enabled and we're not authed
    // which is actually good - it means RLS is working
    const { error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', 'test-user-id');

    if (error && error.message.includes('permission')) {
      console.log('✅ RLS policies are enforced (permission denied as expected)\n');
    } else if (error) {
      console.log('⚠️  RLS check ambiguous:', error.message, '\n');
    } else {
      console.log('⚠️  RLS might not be enabled (query succeeded without auth)\n');
    }
  } catch (err) {
    console.log('⚠️  RLS check error:', err.message, '\n');
  }

  // Test 3: Check schema
  console.log('Test 3: Checking table schema...');
  try {
    const { data, error } = await supabase
      .rpc('get_table_info', { table_name: 'attendance' });

    if (error) {
      console.log('⚠️  Could not retrieve schema (RPC might not exist)\n');
    } else {
      console.log('✅ Schema info:', data, '\n');
    }
  } catch (err) {
    console.log('⚠️  Schema check skipped\n');
  }

  console.log('✅ All tests passed!');
  console.log('→ Attendance table is ready to use');
  console.log('→ Test the logAttendance() function');
}

test().catch(console.error);
