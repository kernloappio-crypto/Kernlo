import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import type { ParsedActivityData, NLPParseRequest } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Available subjects in Kernlo (from activities table schema + extracurricular)
const AVAILABLE_SUBJECTS = [
  'English',
  'Math',
  'Science',
  'History',
  'Art',
  'PE',
  'Music',
  'Social Studies',
  'Language Arts',
  'Reading',
  'Writing',
  'Spelling',
  'Grammar',
  'Literature',
  'Algebra',
  'Geometry',
  'Calculus',
  'Biology',
  'Chemistry',
  'Physics',
  'Earth Science',
  'Extracurricular',
];

export async function POST(req: NextRequest) {
  try {
    const body: NLPParseRequest = await req.json();
    let { text, user_id, available_students } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing required field: user_id' },
        { status: 400 }
      );
    }

    // Allow empty/whitespace text - let NLP handle it
    // This enables the no-validation flow

    // Fetch available students if not provided
    if (!available_students || available_students.length === 0) {
      const { data: kids, error: kidsError } = await supabase
        .from('kids')
        .select('name')
        .eq('user_id', user_id);

      if (kidsError) {
        console.warn('⚠️ Could not fetch kids:', kidsError);
        available_students = [];
      } else {
        available_students = (kids || []).map((k: any) => k.name);
      }
    }

    // Call OpenAI GPT-4o mini
    const prompt = `You are a homeschool activity parser. Extract structured data from the parent's input.

Available students: ${available_students.join(', ')}
Available subjects: ${AVAILABLE_SUBJECTS.join(', ')}

Parse this: "${text}"

IMPORTANT: Check if input mentions multiple kids or multiple separate activities.

Return ONLY valid JSON (no markdown, no code blocks):

**CASE 1: Single activity (possibly with multiple kids doing the same thing)**
{
  "type": "single",
  "students": ["student1", "student2"],  // Array of student names (can be 1 or more)
  "subject": "subject",
  "minutes": 30,
  "note": "lesson topic or details",
  "platform": "platform or location",
  "date": "YYYY-MM-DD or null",
  "confidence": 0.95
}

**CASE 2: Multiple separate activities**
{
  "type": "multiple",
  "activities": [
    {
      "students": ["student1"],
      "subject": "subject",
      "minutes": 30,
      "note": "lesson topic",
      "platform": "platform",
      "date": "YYYY-MM-DD or null",
      "confidence": 0.95
    },
    {
      "students": ["student2"],
      "subject": "subject2",
      "minutes": 45,
      "note": "lesson topic2",
      "platform": "platform2",
      "date": "YYYY-MM-DD or null",
      "confidence": 0.95
    }
  ]
}

Rules:
- MULTI-KID DETECTION:
  * Look for: "X and Y", "X & Y", "X, Y", "X, Y, and Z"
  * Example: "Jett and Alerie did 30m math" → one activity, two kids
  * Example: "Jett 30m math and Alerie 45m science" → two activities, one kid each
  * When kids do the SAME activity (subject, duration), group them: students: ["Jett", "Alerie"]
  * When kids do DIFFERENT activities, use type: "multiple" with separate entries
- Extract student names (e.g., "Ella", "Jett", "Tripp", "Alerie")
  * If "and" or "&" or "," separates names, extract ALL
  * Return in students array
- Extract subject (match to available subjects list)
  * Special: if "Field Trip" is mentioned, use "Field Trip" as subject
- Extract MINUTES: Convert ANY time format to minutes (integer):
  * "20m" or "20 m" → 20
  * "30 mins" or "30 min" → 30
  * "1h" or "1 hour" → 60
  * "1.5 hours" or "1.5h" → 90
  * "2h 30m" → 150
  * Just a number "45" → assume minutes
  * If duration is NOT found in input, set minutes to null
  * CRITICAL: Do NOT default to 30. Return null if no duration is mentioned.
- Extract PLATFORM/LOCATION:
  * For field trips: extract location name (e.g., "Bob Bullock Museum")
  * For online: match these keywords (case-insensitive):
    - "khan" or "khan academy" → "Khan Academy"
    - "ixl" → "IXL"
    - "youtube" → "YouTube"
    - "epic" → "Epic!"
    - "duolingo" → "Duolingo"
    - "quizlet" → "Quizlet"
    - "outschool" → "Outschool"
    - "twinkl" → "Twinkl"
    - "acellus" → "Acellus"
  * Or extract the last noun/name as platform if no keyword matches
  * If missing, set to null (user will be asked)
- Extract notes/topic (e.g., "fractions", "US History", "Chapter 5")
- Extract DATE if mentioned in format like "May 5", "today", "yesterday", etc. Otherwise set to null
- If any student name is not in available_students, set confidence to 0.5 and return the best guess
- If subject is not in available subjects, use "Extracurricular" (unless "Field Trip")
- confidence should be 0.0-1.0 based on how clear the input is
  * Full clarity (all fields found, known students) = 0.95+
  * Missing duration (minutes=null) = 0.3 or lower (required field missing)
  * Missing platform/notes = 0.6-0.8
  * Ambiguous = 0.3-0.5
  * Empty/unclear = 0.1`;

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

    // Parse JSON from response (handle code block wrapping)
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const parsed = JSON.parse(jsonStr);

    // Handle multi-activity response from NLP
    if (parsed.type === 'multiple' && parsed.activities) {
      // Multiple separate activities (e.g., "Jett 30m math and Alerie 45m science")
      return NextResponse.json({
        success: true,
        data: {
          type: 'multiple',
          activities: parsed.activities,
          confidence: Math.min(...parsed.activities.map((a: any) => a.confidence)),
        },
      });
    }

    // Handle single activity (possibly with multiple kids)
    if (parsed.type === 'single' || parsed.students) {
      // Normalize to new format with students array
      // Only set student if students array has values, otherwise null (let parent select)
      const normalizedData: ParsedActivityData = {
        student: (parsed.students && parsed.students.length > 0) ? parsed.students[0] : (parsed.student || null),
        students: parsed.students || (parsed.student ? [parsed.student] : []),
        subject: parsed.subject || null,
        minutes: parsed.minutes || null,
        note: parsed.note || null,
        platform: parsed.platform || null,
        date: parsed.date || null,
        confidence: parsed.confidence || 0,
      };

      // Check confidence and required fields
      const isHighConfidence = normalizedData.confidence >= 0.9;
      const hasRequiredFields =
        (normalizedData.students?.length || 0) > 0 &&
        normalizedData.subject &&
        normalizedData.minutes;

      if (isHighConfidence && hasRequiredFields) {
        return NextResponse.json({
          success: true,
          data: normalizedData,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            data: normalizedData,
            error: `Please review the parsed activity${
              normalizedData.confidence < 0.9 ? ' (low confidence)' : ''
            }${!hasRequiredFields ? ' (missing fields)' : ''}.`,
          },
          { status: 200 }
        );
      }
    }

    // Fallback: old format (shouldn't happen with new prompt, but handle it)
    const fallbackData: ParsedActivityData = {
      student: parsed.student || null,
      students: parsed.student ? [parsed.student] : [],
      subject: parsed.subject || null,
      minutes: parsed.minutes || null,
      note: parsed.note || null,
      platform: parsed.platform || null,
      date: parsed.date || null,
      confidence: parsed.confidence || 0,
    };

    const isHighConfidence = fallbackData.confidence >= 0.9;
    const hasRequiredFields = (fallbackData.students?.length || 0) > 0 && fallbackData.subject && fallbackData.minutes;

    if (isHighConfidence && hasRequiredFields) {
      return NextResponse.json({
        success: true,
        data: fallbackData,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          data: fallbackData,
          error: `Please review the parsed activity${
            fallbackData.confidence < 0.9 ? ' (low confidence)' : ''
          }${!hasRequiredFields ? ' (missing fields)' : ''}.`,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('🔴 NLP parse error:', error);
    return NextResponse.json(
      { error: error?.message || 'NLP parsing failed' },
      { status: 500 }
    );
  }
}
