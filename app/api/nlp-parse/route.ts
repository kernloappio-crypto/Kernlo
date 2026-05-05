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

Return ONLY valid JSON (no markdown, no code blocks):
{
  "student": "student_name or null if unclear",
  "subject": "subject or 'Extracurricular' if unrecognized",
  "minutes": null,
  "note": "lesson topic or details",
  "platform": "platform or location",
  "date": "YYYY-MM-DD or null",
  "confidence": 0.95
}

Rules:
- Extract student name (e.g., "Ella", "Jett", "Tripp")
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
- If student name is not in available_students, set confidence to 0.5 and return the best guess
- If subject is not in available subjects, use "Extracurricular" (unless "Field Trip")
- confidence should be 0.0-1.0 based on how clear the input is
  * Full clarity (all fields found, known student) = 0.95+
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

    const parsed: ParsedActivityData = JSON.parse(jsonStr);

    // Always return the parsed data; confidence is checked by frontend
    // Frontend will show confirm card if confidence < 0.9 OR required fields missing
    const isHighConfidence = parsed.confidence >= 0.9;
    const hasRequiredFields = parsed.student && parsed.subject && parsed.minutes;

    if (isHighConfidence && hasRequiredFields) {
      return NextResponse.json({
        success: true,
        data: parsed,
      });
    } else {
      // Return parsed data for user review (frontend will show confirm card)
      return NextResponse.json(
        {
          success: false,
          data: parsed,
          error: `Please review the parsed activity${
            parsed.confidence < 0.9 ? ' (low confidence)' : ''
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
