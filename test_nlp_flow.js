#!/usr/bin/env node

/**
 * Test script for NLP CommandBar flow
 * Tests: field trips, regular activities, incomplete input
 */

const baseURL = process.env.BASE_URL || 'http://localhost:3000';

async function testNLP(text, availableStudents = ['Alerie', 'Jett', 'Tripp']) {
  console.log(`\n📝 Testing: "${text}"`);
  console.log('-'.repeat(60));

  try {
    const response = await fetch(`${baseURL}/api/nlp-parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        user_id: 'test-user',
        available_students: availableStudents,
      }),
    });

    const result = await response.json();
    console.log(`Status: ${response.ok ? '✅ OK' : '⚠️ ' + response.status}`);
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    
    if (result.data) {
      const { student, subject, minutes, platform, date, confidence, note } = result.data;
      console.log(`\nParsed Data:`);
      console.log(`  Student: ${student || '(empty)'}`);
      console.log(`  Subject: ${subject || '(empty)'}`);
      console.log(`  Minutes: ${minutes}`);
      console.log(`  Platform: ${platform || '(empty)'}`);
      console.log(`  Date: ${date || '(empty)'}`);
      console.log(`  Note: ${note || '(empty)'}`);
      console.log(`  Confidence: ${(confidence * 100).toFixed(0)}%`);

      // Check auto-save criteria
      const hasRequired = student && subject && minutes;
      const isHighConf = confidence >= 0.9;
      console.log(`\nAuto-save check:`);
      console.log(`  Has required fields: ${hasRequired ? '✅' : '❌'}`);
      console.log(`  High confidence (≥90%): ${isHighConf ? '✅' : '❌'}`);
      console.log(`  Would auto-save: ${hasRequired && isHighConf ? '✅ YES' : '❌ NO (show confirm card)'}`);
    }

    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error(`❌ Test failed:`, error.message);
  }
}

async function runTests() {
  console.log('🧪 CommandBar NLP Flow Tests');
  console.log('='
.repeat(60));

  // Test 1: Field trip with all fields
  await testNLP('Alerie Field Trip Bob Bullock Museum 2h');

  // Test 2: Regular activity with all fields
  await testNLP('Jett 45m Science IXL');

  // Test 3: Field trip without duration (should estimate)
  await testNLP('Tripp Field Trip Austin Zoo');

  // Test 4: Regular activity with duration only
  await testNLP('Jett 30m Math Khan');

  // Test 5: Incomplete input (student + duration only)
  await testNLP('Ella 1h');

  // Test 6: Empty text
  await testNLP('');

  // Test 7: Just a subject
  await testNLP('Math');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test run complete');
}

runTests();
