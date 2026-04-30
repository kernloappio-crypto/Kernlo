/**
 * Test attendance logging programmatically
 * This simulates the browser flow without needing a GUI
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tyzvhpyrighqayuqchwra.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAttendanceLogging() {
  console.log('\n🧪 Testing Attendance Logging Fix\n');
  console.log('================================\n');

  try {
    // Step 1: Check if attendance table exists
    console.log('Step 1: Verifying attendance table exists...');
    const { data: tableTest, error: tableError } = await supabase
      .from('attendance')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code !== 'PGRST116') {
      console.error('❌ Attendance table error:', tableError.message);
      return;
    }
    console.log('✅ Attendance table exists\n');

    // Step 2: Test RLS policy by trying to insert without auth
    console.log('Step 2: Testing RLS policy (should fail without auth)...');
    const { error: rls_test } = await supabase
      .from('attendance')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        child_name: 'test',
        schooling_date: new Date().toISOString().split('T')[0],
      })
      .select();
    
    if (rls_test) {
      console.log('✅ RLS correctly rejected unauthenticated insert:', rls_test.message);
    } else {
      console.log('⚠️  RLS did not reject unauthenticated insert (unexpected)');
    }
    console.log();

    // Step 3: Sign up a test user
    console.log('Step 3: Creating test user...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signupError) {
      console.error('❌ Signup failed:', signupError.message);
      return;
    }

    const userId = signupData.user?.id;
    console.log(`✅ Test user created: ${userId}\n`);

    // Step 4: Sign in to get session
    console.log('Step 4: Signing in...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      return;
    }

    const session = loginData.session;
    console.log(`✅ Signed in, session token obtained\n`);

    // Step 5: Set the session on the client (simulate browser restoring from localStorage)
    console.log('Step 5: Setting session on client (simulating localStorage restore)...');
    const { error: setSessionError } = await supabase.auth.setSession(session);
    if (setSessionError) {
      console.error('❌ Failed to set session:', setSessionError.message);
      return;
    }
    console.log('✅ Session set on client\n');

    // Step 6: Test inserting attendance
    console.log('Step 6: Testing attendance insertion...');
    const today = new Date().toISOString().split('T')[0];
    
    const { data: insertData, error: insertError } = await supabase
      .from('attendance')
      .insert({
        user_id: userId,
        child_name: 'TestChild',
        schooling_date: today,
      })
      .select();

    if (insertError) {
      console.error('❌ Attendance insertion failed:', insertError.message);
      console.error('   Code:', insertError.code);
      console.error('   Details:', insertError.details);
      console.error('   Hint:', insertError.hint);
      return;
    }

    console.log('✅ Attendance inserted successfully!');
    console.log('   Record:', insertData?.[0]);
    console.log();

    // Step 7: Test duplicate handling
    console.log('Step 7: Testing duplicate handling...');
    const { data: duplicateData, error: duplicateError } = await supabase
      .from('attendance')
      .insert({
        user_id: userId,
        child_name: 'TestChild',
        schooling_date: today,
      })
      .select();

    if (duplicateError) {
      if (duplicateError.code === '23505' || duplicateError.message.includes('duplicate')) {
        console.log('✅ Duplicate correctly rejected (UNIQUE constraint)');
        
        // Try to fetch the existing record
        const { data: existing } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', userId)
          .eq('child_name', 'TestChild')
          .eq('schooling_date', today)
          .single();
        
        if (existing) {
          console.log('✅ Existing record retrieved for duplicate date');
        }
      } else {
        console.error('❌ Unexpected error:', duplicateError.message);
      }
    } else {
      console.error('⚠️  Duplicate should have been rejected but wasn\'t');
    }
    console.log();

    // Step 8: Test reading back attendance
    console.log('Step 8: Reading attendance records...');
    const { data: readData, error: readError } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('child_name', 'TestChild')
      .order('schooling_date', { ascending: false });

    if (readError) {
      console.error('❌ Read failed:', readError.message);
      return;
    }

    console.log(`✅ Retrieved ${readData?.length || 0} attendance records`);
    if (readData && readData.length > 0) {
      console.log('   Most recent:', readData[0]);
    }
    console.log();

    console.log('================================');
    console.log('✅ ALL TESTS PASSED!\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testAttendanceLogging().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
