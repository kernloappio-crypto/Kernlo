import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyzvhpyrighqayuqchwra.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';

const client = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  try {
    // Check field_trips table
    const { data: fieldTripsData, error: fieldTripsError } = await client
      .from('field_trips')
      .select('*')
      .limit(1);

    console.log('field_trips table check:');
    if (fieldTripsError) {
      console.log('  Error:', fieldTripsError.message);
    } else {
      console.log('  OK - Table exists');
    }

    // Check extracurricular_activities table
    const { data: activitiesData, error: activitiesError } = await client
      .from('extracurricular_activities')
      .select('*')
      .limit(1);

    console.log('extracurricular_activities table check:');
    if (activitiesError) {
      console.log('  Error:', activitiesError.message);
    } else {
      console.log('  OK - Table exists');
    }
  } catch (err) {
    console.error('Connection error:', err);
  }
}

checkSchema();
