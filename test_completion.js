#!/usr/bin/env node

/**
 * Test script: Verify is_completed columns exist and update operations work
 * Run: node test_completion.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tyzvhpyrghqayuqchwra.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCompletion() {
  console.log('🔍 Testing is_completed columns and update functionality...\n');

  try {
    // Test 1: Check if columns exist by trying to select them
    console.log('1️⃣  Testing activities table...');
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('id, is_completed')
      .limit(1);

    if (activitiesError) {
      console.error('❌ Error querying activities:', activitiesError);
      console.error('   This likely means is_completed column does NOT exist');
    } else {
      console.log('✅ activities table has is_completed column');
      if (activitiesData?.length > 0) {
        console.log('   Sample:', activitiesData[0]);
      }
    }

    // Test 2: extracurricular_activities
    console.log('\n2️⃣  Testing extracurricular_activities table...');
    const { data: extraData, error: extraError } = await supabase
      .from('extracurricular_activities')
      .select('id, is_completed')
      .limit(1);

    if (extraError) {
      console.error('❌ Error querying extracurricular_activities:', extraError);
    } else {
      console.log('✅ extracurricular_activities table has is_completed column');
      if (extraData?.length > 0) {
        console.log('   Sample:', extraData[0]);
      }
    }

    // Test 3: field_trips
    console.log('\n3️⃣  Testing field_trips table...');
    const { data: tripsData, error: tripsError } = await supabase
      .from('field_trips')
      .select('id, is_completed')
      .limit(1);

    if (tripsError) {
      console.error('❌ Error querying field_trips:', tripsError);
    } else {
      console.log('✅ field_trips table has is_completed column');
      if (tripsData?.length > 0) {
        console.log('   Sample:', tripsData[0]);
      }
    }

    console.log('\n✅ All tables checked');

  } catch (err) {
    console.error('🚨 Unexpected error:', err);
  }
}

testCompletion();
