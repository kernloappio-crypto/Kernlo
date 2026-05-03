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

    if (!text || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: text, user_id' },
        { status: 400 }
      );
    }

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
  "minutes": 30,
  "note": "lesson topic or details",
  "platform": null,
  "confidence": 0.95
}

Rules:
- If student name is not in available_students, set confidence to 0.5 and return the best guess
- If minutes are missing, default to 30 and add "[estimated]" to note
- If subject is not in available subjects, use "Extracurricular"
- confidence should be 0.0-1.0 based on how clear the input is`;

    const message = await openai.messages.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON from response (handle code block wrapping)
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const parsed: ParsedActivityData = JSON.parse(jsonStr);

    // Validation: confidence check
    if (parsed.confidence < 0.7) {
      return NextResponse.json(
        {
          success: false,
          data: parsed,
          error: `Low confidence (${parsed.confidence}). Clarification needed.`,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('🔴 NLP parse error:', error);
    return NextResponse.json(
      { error: error?.message || 'NLP parsing failed' },
      { status: 500 }
    );
  }
}
