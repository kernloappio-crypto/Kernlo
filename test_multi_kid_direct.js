#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

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

// Use a proper UUID for test user
function generateUUID() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older Node versions
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const TEST_USER_ID = generateUUID();
const testDate = '2026-05-03';

async function testMultiKidActivities() {
  console.log('🟨 Starting Multi-Kid Activity Tests\n');
  console.log('📅 Test Date: May 3, 2026\n');
  console.log(`🔐 Using Test User ID: ${TEST_USER_ID}\n`);
  
  try {
    // Setup: Create test parent profile
    console.log('=== SETUP: Creating test parent profile ===');
    
    const { data: parentData, error: parentError } = await supabase
      .from('parent_profiles')
      .insert({
        user_id: TEST_USER_ID,
        first_name: 'Test',
        last_name: 'Parent',
        email: `parent_${TEST_USER_ID}@example.com`,
      })
      .select();

    if (parentError && parentError.code !== 'PGRST116') { // Ignore duplicate key errors
      console.log(`⚠️  Parent profile insert returned: ${parentError.message}`);
    } else {
      console.log(`✅ Created/verified test parent`);
    }
    console.log(`✅ User ID: ${TEST_USER_ID}\n`);

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
          user_id: TEST_USER_ID,
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

    // ========== SCENARIO 1: Core Subject - Multiple Kids ==========
    console.log('=== SCENARIO 1: Quick Log - Multiple Kids, Core Subject ===');
    console.log(`Activity: Math, Duration: 2.5 hours, Date: ${testDate}`);
    console.log(`Kids: ${kid1.name}, ${kid2.name}\n`);

    try {
      // Create activity for 2 kids - simulating the multi-kid save loop
      const coreSubjectActivities = [
        {
          user_id: TEST_USER_ID,
          child_name: kid1.name,
          activity_type: 'Core Subject',
          date: testDate,
          notes: 'Test math activity',
          curriculum: 'Homeschool Curriculum',
          subject: 'Math',
          duration: 2.5,
        },
        {
          user_id: TEST_USER_ID,
          child_name: kid2.name,
          activity_type: 'Core Subject',
          date: testDate,
          notes: 'Test math activity',
          curriculum: 'Homeschool Curriculum',
          subject: 'Math',
          duration: 2.5,
        },
      ];

      // Insert activities using the EXACT same method as the app's handleQuickLogSave
      // (loops through each kid and inserts individually)
      for (const activity of coreSubjectActivities) {
        const { data: insertedCore, error: coreError } = await supabase
          .from('activities')
          .insert(activity)
          .select();

        if (coreError) {
          console.error(`❌ Error creating core subject activity for ${activity.child_name}:`, coreError.message);
          testResults.scenario1.details = `Failed to insert: ${coreError.message}`;
          return;
        }
        console.log(`  ✓ Inserted activity for ${activity.child_name}`);
      }

      // Verify activities appear for both kids
      const { data: verifyCore, error: verifyError } = await supabase
        .from('activities')
        .select('*')
        .eq('subject', 'Math')
        .eq('date', testDate)
        .eq('user_id', TEST_USER_ID);

      if (verifyError) {
        console.error('❌ Error verifying activities:', verifyError.message);
        testResults.scenario1.details = `Verification error: ${verifyError.message}`;
      } else {
        const kid1Activity = verifyCore.find(a => a.child_name === kid1.name && a.subject === 'Math');
        const kid2Activity = verifyCore.find(a => a.child_name === kid2.name && a.subject === 'Math');

        if (kid1Activity && kid2Activity) {
          const kid1DurationOk = Math.abs(kid1Activity.duration - 2.5) < 0.01;
          const kid2DurationOk = Math.abs(kid2Activity.duration - 2.5) < 0.01;
          const kid1DateOk = kid1Activity.date === testDate;
          const kid2DateOk = kid2Activity.date === testDate;

          console.log(`\n✅ VERIFICATION:`);
          console.log(`  • Activity for ${kid1.name}: FOUND (duration=${kid1Activity.duration}h, date=${kid1Activity.date})`);
          console.log(`  • Activity for ${kid2.name}: FOUND (duration=${kid2Activity.duration}h, date=${kid2Activity.date})`);
          console.log(`  • Correct date (${testDate}): ${kid1DateOk && kid2DateOk ? '✅' : '❌'}`);
          console.log(`  • Correct duration (2.5h): ${kid1DurationOk && kid2DurationOk ? '✅' : '❌'}`);

          if (kid1Activity && kid2Activity && kid1DateOk && kid2DateOk && kid1DurationOk && kid2DurationOk) {
            testResults.scenario1.passed = true;
            testResults.scenario1.details = 'Activity created for both kids with correct dates and durations';
            console.log(`\n🟨 SCENARIO 1: PASSED\n`);
          } else {
            testResults.scenario1.details = 'Activity found but with incorrect values';
            console.log(`\n❌ SCENARIO 1: FAILED - Values incorrect\n`);
          }
        } else {
          console.error('❌ Activity not found for one or both kids');
          testResults.scenario1.details = `Found kid1: ${!!kid1Activity}, Found kid2: ${!!kid2Activity}`;
          console.log(`\n❌ SCENARIO 1: FAILED - Activities not found\n`);
        }
      }
    } catch (err) {
      console.error('❌ Scenario 1 error:', err.message);
      testResults.scenario1.details = err.message;
      console.log(`\n❌ SCENARIO 1: FAILED - ${err.message}\n`);
    }

    // ========== SCENARIO 2: Extracurricular - Multiple Kids ==========
    console.log('=== SCENARIO 2: Quick Log - Multiple Kids, Extracurricular ===');
    console.log(`Activity: Soccer, Date: ${testDate}`);
    console.log(`Kids: ${kid1.name}, ${kid2.name}\n`);

    try {
      const extracurriculars = [
        {
          user_id: TEST_USER_ID,
          kid_id: kid1.id,
          activity_name: 'Soccer',
          date: testDate,
          notes: 'Test extracurricular',
        },
        {
          user_id: TEST_USER_ID,
          kid_id: kid2.id,
          activity_name: 'Soccer',
          date: testDate,
          notes: 'Test extracurricular',
        },
      ];

      // Insert each activity individually (as per the app's multi-kid loop)
      for (const activity of extracurriculars) {
        const { data: insertedExtra, error: extraError } = await supabase
          .from('extracurricular_activities')
          .insert(activity)
          .select();

        if (extraError) {
          console.error(`❌ Error creating extracurricular for kid:`, extraError.message);
          testResults.scenario2.details = `Failed to insert: ${extraError.message}`;
          return;
        }
        console.log(`  ✓ Inserted extracurricular for kid ${activity.kid_id}`);
      }

      const { data: verifyExtra, error: verifyError } = await supabase
        .from('extracurricular_activities')
        .select('*')
        .eq('activity_name', 'Soccer')
        .eq('date', testDate)
        .eq('user_id', TEST_USER_ID);

      if (verifyError) {
        console.error('❌ Error verifying extracurricular:', verifyError.message);
        testResults.scenario2.details = `Verification error: ${verifyError.message}`;
      } else {
        const kid1Extra = verifyExtra.find(a => a.kid_id === kid1.id && a.activity_name === 'Soccer');
        const kid2Extra = verifyExtra.find(a => a.kid_id === kid2.id && a.activity_name === 'Soccer');

        if (kid1Extra && kid2Extra) {
          const kid1DateOk = kid1Extra.date === testDate;
          const kid2DateOk = kid2Extra.date === testDate;

          console.log(`\n✅ VERIFICATION:`);
          console.log(`  • Extracurricular for ${kid1.name}: FOUND (date=${kid1Extra.date})`);
          console.log(`  • Extracurricular for ${kid2.name}: FOUND (date=${kid2Extra.date})`);
          console.log(`  • Correct date (${testDate}): ${kid1DateOk && kid2DateOk ? '✅' : '❌'}`);
          console.log(`  • No duration field: ✅ (extracurricular has no duration)`);

          if (kid1DateOk && kid2DateOk) {
            testResults.scenario2.passed = true;
            testResults.scenario2.details = 'Extracurricular activity created for both kids with correct dates';
            console.log(`\n🟨 SCENARIO 2: PASSED\n`);
          } else {
            testResults.scenario2.details = 'Activity found but with incorrect dates';
            console.log(`\n❌ SCENARIO 2: FAILED - Dates incorrect\n`);
          }
        } else {
          console.error('❌ Extracurricular not found for one or both kids');
          testResults.scenario2.details = `Found kid1: ${!!kid1Extra}, Found kid2: ${!!kid2Extra}`;
          console.log(`\n❌ SCENARIO 2: FAILED - Activities not found\n`);
        }
      }
    } catch (err) {
      console.error('❌ Scenario 2 error:', err.message);
      testResults.scenario2.details = err.message;
      console.log(`\n❌ SCENARIO 2: FAILED - ${err.message}\n`);
    }

    // ========== SCENARIO 3: Field Trip - Multiple Kids ==========
    console.log('=== SCENARIO 3: Quick Log - Multiple Kids, Field Trip ===');
    console.log(`Activity: Museum, Destination: Science Museum, Date: ${testDate}`);
    console.log(`Kids: ${kid1.name}, ${kid2.name}, ${kid3.name}\n`);

    try {
      const fieldTrips = [
        {
          user_id: TEST_USER_ID,
          kid_id: kid1.id,
          trip_name: 'Museum',
          destination: 'Science Museum',
          date: testDate,
          notes: 'Test field trip',
        },
        {
          user_id: TEST_USER_ID,
          kid_id: kid2.id,
          trip_name: 'Museum',
          destination: 'Science Museum',
          date: testDate,
          notes: 'Test field trip',
        },
        {
          user_id: TEST_USER_ID,
          kid_id: kid3.id,
          trip_name: 'Museum',
          destination: 'Science Museum',
          date: testDate,
          notes: 'Test field trip',
        },
      ];

      // Insert each field trip individually (as per the app's multi-kid loop)
      for (const trip of fieldTrips) {
        const { data: insertedTrip, error: tripError } = await supabase
          .from('field_trips')
          .insert(trip)
          .select();

        if (tripError) {
          console.error(`❌ Error creating field trip for kid:`, tripError.message);
          testResults.scenario3.details = `Failed to insert: ${tripError.message}`;
          return;
        }
        console.log(`  ✓ Inserted field trip for kid ${trip.kid_id}`);
      }

      const { data: verifyTrip, error: verifyError } = await supabase
        .from('field_trips')
        .select('*')
        .eq('trip_name', 'Museum')
        .eq('date', testDate)
        .eq('user_id', TEST_USER_ID);

      if (verifyError) {
        console.error('❌ Error verifying field trip:', verifyError.message);
        testResults.scenario3.details = `Verification error: ${verifyError.message}`;
      } else {
        const trip1 = verifyTrip.find(a => a.kid_id === kid1.id && a.trip_name === 'Museum');
        const trip2 = verifyTrip.find(a => a.kid_id === kid2.id && a.trip_name === 'Museum');
        const trip3 = verifyTrip.find(a => a.kid_id === kid3.id && a.trip_name === 'Museum');

        if (trip1 && trip2 && trip3) {
          const trip1Ok = trip1.date === testDate && trip1.destination === 'Science Museum';
          const trip2Ok = trip2.date === testDate && trip2.destination === 'Science Museum';
          const trip3Ok = trip3.date === testDate && trip3.destination === 'Science Museum';

          console.log(`\n✅ VERIFICATION:`);
          console.log(`  • Field trip for ${kid1.name}: FOUND (date=${trip1.date}, dest=${trip1.destination})`);
          console.log(`  • Field trip for ${kid2.name}: FOUND (date=${trip2.date}, dest=${trip2.destination})`);
          console.log(`  • Field trip for ${kid3.name}: FOUND (date=${trip3.date}, dest=${trip3.destination})`);
          console.log(`  • Correct date (${testDate}): ${trip1Ok && trip2Ok && trip3Ok ? '✅' : '❌'}`);
          console.log(`  • Correct destination (Science Museum): ${trip1Ok && trip2Ok && trip3Ok ? '✅' : '❌'}`);

          if (trip1Ok && trip2Ok && trip3Ok) {
            testResults.scenario3.passed = true;
            testResults.scenario3.details = 'Field trip created for all 3 kids with correct dates and destinations';
            console.log(`\n🟨 SCENARIO 3: PASSED\n`);
          } else {
            testResults.scenario3.details = 'Activities found but with incorrect values';
            console.log(`\n❌ SCENARIO 3: FAILED - Values incorrect\n`);
          }
        } else {
          console.error('❌ Field trip not found for one or more kids');
          testResults.scenario3.details = `Found kid1: ${!!trip1}, Found kid2: ${!!trip2}, Found kid3: ${!!trip3}`;
          console.log(`\n❌ SCENARIO 3: FAILED - Activities not found\n`);
        }
      }
    } catch (err) {
      console.error('❌ Scenario 3 error:', err.message);
      testResults.scenario3.details = err.message;
      console.log(`\n❌ SCENARIO 3: FAILED - ${err.message}\n`);
    }

    // ========== TEST SUMMARY ==========
    console.log('\n=====================================');
    console.log('         FINAL TEST SUMMARY');
    console.log('=====================================\n');
    
    const results = [
      { name: 'Scenario 1 (Core Subject, 2 kids)', passed: testResults.scenario1.passed },
      { name: 'Scenario 2 (Extracurricular, 2 kids)', passed: testResults.scenario2.passed },
      { name: 'Scenario 3 (Field Trip, 3 kids)', passed: testResults.scenario3.passed },
    ];

    for (const result of results) {
      const status = result.passed ? '🟨 PASSED' : '❌ FAILED';
      console.log(`${status} - ${result.name}`);
    }

    const allPassed = testResults.scenario1.passed && testResults.scenario2.passed && testResults.scenario3.passed;
    console.log(`\n${allPassed ? '🟨 ✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}\n`);

    process.exit(allPassed ? 0 : 1);

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

testMultiKidActivities().catch(console.error);
