const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AVAILABLE_SUBJECTS = [
  'English', 'Math', 'Science', 'History', 'Art', 'PE', 'Music',
  'Social Studies', 'Language Arts', 'Reading', 'Writing', 'Spelling',
  'Grammar', 'Literature', 'Algebra', 'Geometry', 'Calculus',
  'Biology', 'Chemistry', 'Physics', 'Earth Science', 'Extracurricular',
];

async function testNLP(text) {
  console.log(`\n📝 Testing: "${text}"`);
  console.log('-'.repeat(60));

  const available_students = ['Alerie', 'Jett', 'Tripp'];
  
  const prompt = `You are a homeschool activity parser. Extract structured data from the parent's input.

Available students: ${available_students.join(', ')}
Available subjects: ${AVAILABLE_SUBJECTS.join(', ')}

Parse this: "${text}"

Return ONLY valid JSON:
{
  "student": "student_name or null",
  "subject": "subject",
  "minutes": null,
  "note": "topic",
  "platform": "platform",
  "date": "YYYY-MM-DD or null",
  "confidence": 0.95
}

Rules:
- Extract MINUTES as integer: "30m" → 30, "1h" → 60, etc. If NOT found, set minutes to null.
- Extract PLATFORM: "khan" → "Khan Academy", etc.
- If student not in available_students, set confidence to 0.5
- If minutes=null, confidence ≤ 0.3
- confidence 0-1 based on clarity`;

  const message = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.choices[0].message.content || '';
  console.log('Raw response:', responseText);

  let jsonStr = responseText.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  try {
    const parsed = JSON.parse(jsonStr);
    console.log('\nParsed JSON:');
    console.log(JSON.stringify(parsed, null, 2));
    
    const { student, subject, minutes, platform, confidence } = parsed;
    console.log('\nExtracted fields:');
    console.log(`  student: ${student === null ? 'NULL' : student}`);
    console.log(`  subject: ${subject}`);
    console.log(`  minutes: ${minutes === null ? 'NULL' : minutes} (type: ${typeof minutes})`);
    console.log(`  platform: ${platform === null ? 'NULL' : platform}`);
    console.log(`  confidence: ${confidence}`);

    const hasRequired = student && subject && minutes !== null && minutes !== undefined;
    const isHighConf = confidence >= 0.9;
    console.log(`\nWould show ConfirmCard: ${!hasRequired || !isHighConf ? '✅ YES' : '❌ NO (auto-save)'}`);
  } catch (e) {
    console.error('JSON Parse error:', e.message);
  }
}

testNLP('Biology 30m Khan').catch(console.error);
