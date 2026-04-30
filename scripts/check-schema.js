#!/usr/bin/env node
/**
 * Debug script to verify is_completed columns exist in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const url = 'https://tyzvhpyrighqayuqchwra.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';

const supabase = createClient(url, key);

async function checkSchema() {
  console.log('🔍 Checking Supabase schema for is_completed columns...\n');

  try {
    // Query information_schema to get column info
    const { data: activitiesCols, error: activitiesErr } = await supabase
      .from('activities')
      .select('id')
      .limit(0);

    if (activitiesErr && activitiesErr.message.includes('is_completed')) {
      console.log('❌ activities.is_completed: MISSING (column not found)');
    } else if (activitiesErr) {
      console.log('⚠️  activities table error:', activitiesErr.message);
    } else {
      console.log('✅ activities table exists');
    }

    // Try to update with is_completed on a fake ID to test the column
    console.log('\n📝 Testing is_completed column accessibility...\n');

    const testId = '00000000-0000-0000-0000-000000000000'; // Non-existent UUID

    const { error: testError } = await supabase
      .from('activities')
      .update({ is_completed: true })
      .eq('id', testId);

    if (testError) {
      if (testError.message.includes('is_completed')) {
        console.log('❌ activities.is_completed: COLUMN DOES NOT EXIST');
        console.log('   Error:', testError.message);
      } else if (testError.code === 'PGRST116') {
        console.log('✅ activities.is_completed: COLUMN EXISTS (no rows match, which is expected)');
      } else {
        console.log('⚠️  Unexpected error:', testError.message);
      }
    } else {
      console.log('✅ activities.is_completed: COLUMN EXISTS');
    }

    // Check extracurricular_activities
    const { error: extError } = await supabase
      .from('extracurricular_activities')
      .update({ is_completed: true })
      .eq('id', testId);

    if (extError) {
      if (extError.message.includes('is_completed')) {
        console.log('❌ extracurricular_activities.is_completed: COLUMN DOES NOT EXIST');
      } else if (extError.code === 'PGRST116') {
        console.log('✅ extracurricular_activities.is_completed: COLUMN EXISTS');
      }
    } else {
      console.log('✅ extracurricular_activities.is_completed: COLUMN EXISTS');
    }

    // Check field_trips
    const { error: tripError } = await supabase
      .from('field_trips')
      .update({ is_completed: true })
      .eq('id', testId);

    if (tripError) {
      if (tripError.message.includes('is_completed')) {
        console.log('❌ field_trips.is_completed: COLUMN DOES NOT EXIST');
      } else if (tripError.code === 'PGRST116') {
        console.log('✅ field_trips.is_completed: COLUMN EXISTS');
      }
    } else {
      console.log('✅ field_trips.is_completed: COLUMN EXISTS');
    }

    console.log('\n✨ Schema check complete');
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

checkSchema();
