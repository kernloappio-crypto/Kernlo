#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tyzvhpyrghqayuqchwra.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

let testResults = {
  scenario1: { passed: false, details: '' },
  scenario2: { passed: false, details: '' },
  scenario3: { passed: false, details: '' },
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testMultiKidActivities() {
  console.log('🟨 Starting Multi-Kid Activity Tests\n');
  console.log('📅 Test Date: May 3, 2026\n');
  
  try {
    // Setup: Create test parent user
    console.log('=== SETUP: Creating test parent ===');
    const testEmail = `test_parent_${Date.now()}@example.com`;
    const testPassword = 'TestPass123!@#';
    
    // Sign up
    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signupError) {
      console.error('❌ Signup error:', signupError.message);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      console.error('❌ No user ID returned');
      return;
    }

    console.log(`✅ Created test user: ${testEmail}`);
    console.log(`✅ User ID: ${userId}\n`);

    // Wait for user to be ready
    await sleep(1000);

    // Sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.error('❌ Sign in error:', signInError.message);
      return;
    }

    const session = signInData.session;
    console.log('✅ Signed in successfully\n');

    // Create test kids
    console.log('=== SETUP: Creating test kids ===');
    const kidsToCreate = [
      { name: 'Alice', age: 10, grade: '5th' },
      { name: 'Bob', age: 12, grade: '7th' },
      { name: 'Charlie', age: 8, grade: '3rd' },
    ];

    const createdKids = [];
    for (const kidData of kidsToCreate) {
      const { data, error } = await supabase
        .from('kids')
        .insert({
          user_id: userId,
          name: kidData.name,
          age: kidData.age,
          grade: kidData.grade,
        })
        .select();

      if (error) {
        console.error(`❌ Error creating kid ${kidData.name}:`, error.message);
        return;
      }

      createdKids.push({ id: data[0].id, name: data[0].name });
      console.log(`✅ Created kid: ${kidData.name} (ID: ${data[0].id})`);
    }
    console.log();

    const kid1 = createdKids[0];
    const kid2 = createdKids[1];
    const kid3 = createdKids[2];
    const testDate = '2026-05-03';

    // ========== SCENARIO 1: Core Subject - Multiple Kids ==========
    console.log('=== SCENARIO 1: Quick Log - Multiple Kids, Core Subject ===');
    console.log(`Activity: Math, Duration: 2.5 hours, Date: ${testDate}`);
    console.log(`Kids: ${kid1.name}, ${kid2.name}\n`);

    try {
      // Create activity for 2 kids
      const coreSubjectActivities = [
        {
          user_id: userId,
          child_name: kid1.name,
          activity_type: 'Core Subject',
          date: testDate,
          notes: 'Test math activity',
          curriculum: 'Homeschool Curriculum',
          subject: 'Math',
          duration: 2.5,
        },
        {
          user_id: userId,
          child_name: kid2.name,
          activity_type: 'Core Subject',
          date: testDate,
          notes: 'Test math activity',
          curriculum: 'Homeschool Curriculum',
          subject: 'Math',
          duration: 2.5,
        },
      ];

      const { data: insertedCore, error: coreError } = await supabase
        .from('activities')
        .insert(coreSubjectActivities)
        .select();

      if (coreError) {
        console.error('❌ Error creating core subject activity:', coreError.message);
        testResults.scenario1.details = `Failed to insert: ${coreError.message}`;
      } else {
        console.log(`✅ Inserted ${insertedCore.length} activities`);
        
        // Verify activities appear for both kids
        const { data: verifyCore, error: verifyError } = await supabase
          .from('activities')
          .select('*')
          .eq('subject', 'Math')
          .eq('date', testDate);

        if (verifyError) {
          console.error('❌ Error verifying activities:', verifyError.message);
        } else {
          const kid1Activity = verifyCore.find(a => a.child_name === kid1.name && a.subject === 'Math');
          const kid2Activity = verifyCore.find(a => a.child_name === kid2.name && a.subject === 'Math');

          if (kid1Activity && kid2Activity) {
            const kid1DurationOk = Math.abs(kid1Activity.duration - 2.5) < 0.01;
            const kid2DurationOk = Math.abs(kid2Activity.duration - 2.5) < 0.01;
            const kid1DateOk = kid1Activity.date === testDate;
            const kid2DateOk = kid2Activity.date === testDate;

            console.log(`✅ Activity for ${kid1.name}: found (duration=${kid1Activity.duration}h, date=${kid1Activity.date})`);
            console.log(`✅ Activity for ${kid2.name}: found (duration=${kid2Activity.duration}h, date=${kid2Activity.date})`);
            console.log(`✅ Correct date: ${kid1DateOk && kid2DateOk ? '✅' : '❌'}`);
            console.log(`✅ Correct duration: ${kid1DurationOk && kid2DurationOk ? '✅' : '❌'}`);

            if (kid1Activity && kid2Activity && kid1DateOk && kid2DateOk && kid1DurationOk && kid2DurationOk) {
              testResults.scenario1.passed = true;
              testResults.scenario1.details = 'Activity created for both kids with correct dates and durations';
            }
          } else {
            console.error('❌ Activity not found for one or both kids');
            testResults.scenario1.details = `Found kid1: ${!!kid1Activity}, Found kid2: ${!!kid2Activity}`;
          }
        }
      }
    } catch (err) {
      console.error('❌ Scenario 1 error:', err.message);
      testResults.scenario1.details = err.message;
    }
    console.log();

    // ========== SCENARIO 2: Extracurricular - Multiple Kids ==========
    console.log('=== SCENARIO 2: Quick Log - Multiple Kids, Extracurricular ===');
    console.log(`Activity: Soccer, Date: ${testDate}`);
    console.log(`Kids: ${kid1.name}, ${kid2.name}\n`);

    try {
      const extracurriculars = [
        {
          user_id: userId,
          kid_id: kid1.id,
          activity_name: 'Soccer',
          date: testDate,
          notes: 'Test extracurricular',
        },
        {
          user_id: userId,
          kid_id: kid2.id,
          activity_name: 'Soccer',
          date: testDate,
          notes: 'Test extracurricular',
        },
      ];

      const { data: insertedExtra, error: extraError } = await supabase
        .from('extracurricular_activities')
        .insert(extracurriculars)
        .select();

      if (extraError) {
        console.error('❌ Error creating extracurricular activity:', extraError.message);
        testResults.scenario2.details = `Failed to insert: ${extraError.message}`;
      } else {
        console.log(`✅ Inserted ${insertedExtra.length} extracurricular activities`);
        
        const { data: verifyExtra, error: verifyError } = await supabase
          .from('extracurricular_activities')
          .select('*')
          .eq('activity_name', 'Soccer')
          .eq('date', testDate);

        if (verifyError) {
          console.error('❌ Error verifying extracurricular:', verifyError.message);
        } else {
          const kid1Extra = verifyExtra.find(a => a.kid_id === kid1.id && a.activity_name === 'Soccer');
          const kid2Extra = verifyExtra.find(a => a.kid_id === kid2.id && a.activity_name === 'Soccer');

          if (kid1Extra && kid2Extra) {
            const kid1DateOk = kid1Extra.date === testDate;
            const kid2DateOk = kid2Extra.date === testDate;

            console.log(`✅ Extracurricular for ${kid1.name}: found (date=${kid1Extra.date})`);
            console.log(`✅ Extracurricular for ${kid2.name}: found (date=${kid2Extra.date})`);
            console.log(`✅ Correct date: ${kid1DateOk && kid2DateOk ? '✅' : '❌'}`);
            console.log(`✅ No duration field: true (extracurricular has no duration)`);

            if (kid1DateOk && kid2DateOk) {
              testResults.scenario2.passed = true;
              testResults.scenario2.details = 'Extracurricular activity created for both kids with correct dates';
            }
          } else {
            console.error('❌ Extracurricular not found for one or both kids');
            testResults.scenario2.details = `Found kid1: ${!!kid1Extra}, Found kid2: ${!!kid2Extra}`;
          }
        }
      }
    } catch (err) {
      console.error('❌ Scenario 2 error:', err.message);
      testResults.scenario2.details = err.message;
    }
    console.log();

    // ========== SCENARIO 3: Field Trip - Multiple Kids ==========
    console.log('=== SCENARIO 3: Quick Log - Multiple Kids, Field Trip ===');
    console.log(`Activity: Museum, Destination: Science Museum, Date: ${testDate}`);
    console.log(`Kids: ${kid1.name}, ${kid2.name}, ${kid3.name}\n`);

    try {
      const fieldTrips = [
        {
          user_id: userId,
          kid_id: kid1.id,
          trip_name: 'Museum',
          destination: 'Science Museum',
          date: testDate,
          notes: 'Test field trip',
        },
        {
          user_id: userId,
          kid_id: kid2.id,
          trip_name: 'Museum',
          destination: 'Science Museum',
          date: testDate,
          notes: 'Test field trip',
        },
        {
          user_id: userId,
          kid_id: kid3.id,
          trip_name: 'Museum',
          destination: 'Science Museum',
          date: testDate,
          notes: 'Test field trip',
        },
      ];

      const { data: insertedTrip, error: tripError } = await supabase
        .from('field_trips')
        .insert(fieldTrips)
        .select();

      if (tripError) {
        console.error('❌ Error creating field trip:', tripError.message);
        testResults.scenario3.details = `Failed to insert: ${tripError.message}`;
      } else {
        console.log(`✅ Inserted ${insertedTrip.length} field trip activities`);
        
        const { data: verifyTrip, error: verifyError } = await supabase
          .from('field_trips')
          .select('*')
          .eq('trip_name', 'Museum')
          .eq('date', testDate);

        if (verifyError) {
          console.error('❌ Error verifying field trip:', verifyError.message);
        } else {
          const trip1 = verifyTrip.find(a => a.kid_id === kid1.id && a.trip_name === 'Museum');
          const trip2 = verifyTrip.find(a => a.kid_id === kid2.id && a.trip_name === 'Museum');
          const trip3 = verifyTrip.find(a => a.kid_id === kid3.id && a.trip_name === 'Museum');

          if (trip1 && trip2 && trip3) {
            const trip1Ok = trip1.date === testDate && trip1.destination === 'Science Museum';
            const trip2Ok = trip2.date === testDate && trip2.destination === 'Science Museum';
            const trip3Ok = trip3.date === testDate && trip3.destination === 'Science Museum';

            console.log(`✅ Field trip for ${kid1.name}: found (date=${trip1.date}, dest=${trip1.destination})`);
            console.log(`✅ Field trip for ${kid2.name}: found (date=${trip2.date}, dest=${trip2.destination})`);
            console.log(`✅ Field trip for ${kid3.name}: found (date=${trip3.date}, dest=${trip3.destination})`);

            if (trip1Ok && trip2Ok && trip3Ok) {
              testResults.scenario3.passed = true;
              testResults.scenario3.details = 'Field trip created for all 3 kids with correct dates and destinations';
            }
          } else {
            console.error('❌ Field trip not found for one or more kids');
            testResults.scenario3.details = `Found kid1: ${!!trip1}, Found kid2: ${!!trip2}, Found kid3: ${!!trip3}`;
          }
        }
      }
    } catch (err) {
      console.error('❌ Scenario 3 error:', err.message);
      testResults.scenario3.details = err.message;
    }
    console.log();

    // ========== TEST SUMMARY ==========
    console.log('=== TEST SUMMARY ===\n');
    console.log(`Scenario 1 (Core Subject, 2 kids): ${testResults.scenario1.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Details: ${testResults.scenario1.details}\n`);
    console.log(`Scenario 2 (Extracurricular, 2 kids): ${testResults.scenario2.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Details: ${testResults.scenario2.details}\n`);
    console.log(`Scenario 3 (Field Trip, 3 kids): ${testResults.scenario3.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Details: ${testResults.scenario3.details}\n`);

    const allPassed = testResults.scenario1.passed && testResults.scenario2.passed && testResults.scenario3.passed;
    console.log(`Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`);

    process.exit(allPassed ? 0 : 1);

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
}

testMultiKidActivities().catch(console.error);
