#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tyzvhpyrghqayuqchwra.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log('🧪 Testing Manual Attendance Insert...\n');

  try {
    // Try to insert a test record
    console.log('Attempting to insert a test attendance record...');
    
    const testData = {
      user_id: '3ebf1dc6-0eef-4e65-9b2a-46bfc3d9cd46', // Test user ID from other DB records
      child_name: 'Test Child',
      schooling_date: '2026-04-29'
    };
    
    console.log('Insert data:', testData);
    
    const { data, error } = await supabase
      .from('attendance')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Insert error:');
      console.error('  Message:', error.message);
      console.error('  Code:', error.code);
      console.error('  Details:', error.details);
      console.error('  Hint:', error.hint);
    } else {
      console.log('✅ Insert successful!');
      console.log('Data:', data);
    }

    // Now try to fetch it back
    console.log('\n🔍 Fetching back attendance records...');
    const { data: fetchData, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', testData.user_id);

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError.message);
    } else {
      console.log('✅ Fetched', fetchData.length, 'records');
      fetchData.forEach(r => {
        console.log(`  - ${r.child_name} on ${r.schooling_date}`);
      });
    }

  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

test();
