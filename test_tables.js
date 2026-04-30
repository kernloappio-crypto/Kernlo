const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tyzvhpyrighqayuqchwra.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';

const client = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    console.log('Testing field_trips...');
    const { data, error } = await client.from('field_trips').select('id').limit(1);
    if (error) {
      console.log('field_trips ERROR:', error.message);
    } else {
      console.log('field_trips OK (table exists)');
    }
  } catch (err) {
    console.log('field_trips EXCEPTION:', err.message);
  }

  try {
    console.log('\nTesting extracurricular_activities...');
    const { data, error } = await client.from('extracurricular_activities').select('id').limit(1);
    if (error) {
      console.log('extracurricular_activities ERROR:', error.message);
    } else {
      console.log('extracurricular_activities OK (table exists)');
    }
  } catch (err) {
    console.log('extracurricular_activities EXCEPTION:', err.message);
  }
}

test().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
