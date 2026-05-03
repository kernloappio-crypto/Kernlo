import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SentimentCheckRequest, SentimentCheckResponse } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const STRESS_KEYWORDS = ['stress', 'fail', 'struggling', 'hard', 'overwhelm', "can't", "won't", 'give up', 'behind', 'frustrated', 'tired', 'exhausted', 'impossible'];

/**
 * Check if text contains stress/support keywords
 */
function hasStressKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return STRESS_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

export async function POST(req: NextRequest) {
  try {
    const body: SentimentCheckRequest = await req.json();
    const { text, user_id } = body;

    if (!text || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields: text, user_id' } as any,
        { status: 400 }
      );
    }

    // Quick keyword check
    const needs_support = hasStressKeywords(text);

    if (!needs_support) {
      return NextResponse.json({
        needs_support: false,
      });
    }

    // Generate supportive message from Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a veteran homeschool mentor. The parent just said: "${text}"

They sound stressed/discouraged. Give a SHORT (1-2 sentences), grounded, encouraging response.
Remind them progress isn't linear and homeschooling is a marathon, not a sprint.
Do not try to log data. Be warm, not corporate.

Response:`;

    const result = await model.generateContent(prompt);
    const support_message = result.response.text().trim();

    return NextResponse.json({
      needs_support: true,
      support_message,
    });
  } catch (error: any) {
    console.error('🔴 Sentiment check error:', error);
    return NextResponse.json(
      { error: error?.message || 'Sentiment check failed' },
      { status: 500 }
    );
  }
}
