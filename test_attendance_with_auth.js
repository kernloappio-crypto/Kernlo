#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tyzvhpyrghqayuqchwra.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';

// Create client exactly like the app does
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

async function test() {
  console.log('🧪 Testing Attendance Insert WITH Auth Context...\n');

  try {
    // First, try to get users from the database to get a real user ID
    console.log('Step 1: Getting a real user from database...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (usersError) {
      console.error('❌ Users error:', usersError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No users found in database');
      return;
    }

    const realUser = users[0];
    console.log('✅ Found user:', realUser.email);

    // Now try to insert attendance WITHOUT auth (should fail)
    console.log('\nStep 2: Try insert WITHOUT setting auth session (should fail)...');
    const testData = {
      user_id: realUser.id,
      child_name: 'Debug Test',
      schooling_date: '2026-04-28'
    };

    const { data: failData, error: failError } = await supabase
      .from('attendance')
      .insert([testData])
      .select();

    if (failError) {
      console.error('❌ Expected error (no auth):', failError.message);
    } else {
      console.log('⚠️  Insert succeeded without auth (RLS might be disabled)');
    }

    // Now try WITH auth - but we need a valid JWT token
    console.log('\nStep 3: Try insert WITH service role key (direct insert)...');
    
    // Use service role key for direct insert
    const serviceSupabase = createClient(
      SUPABASE_URL,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM5NjMwMSwiZXhwIjoyMDkwOTcyMzAxfQ.sH2SLeNqBcFN8vWp6e6p3ggm_FuLnKT2_d9s8r2xELs'
    );

    const { data: serviceData, error: serviceError } = await serviceSupabase
      .from('attendance')
      .insert([testData])
      .select();

    if (serviceError) {
      console.error('❌ Service role insert error:', serviceError.message);
    } else {
      console.log('✅ Service role insert successful!');
      console.log('Data:', serviceData);
    }

    // Try to fetch it
    console.log('\nStep 4: Fetch the inserted record...');
    const { data: fetchData } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', realUser.id);

    console.log('✅ Fetched', fetchData?.length || 0, 'records');
    if (fetchData && fetchData.length > 0) {
      fetchData.forEach(r => {
        console.log(`  - ${r.child_name} on ${r.schooling_date}`);
      });
    }

  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

test();
