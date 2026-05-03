import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Cleanup old pending NLP confirmations (older than 5 minutes)
 * Should be called by a cron service (e.g., Railway, Vercel Cron)
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');

    // Simple auth: expect a Bearer token matching CRON_SECRET
    if (process.env.CRON_SECRET) {
      const token = authHeader?.replace('Bearer ', '');
      if (token !== process.env.CRON_SECRET) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Calculate 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { error, count } = await supabase
      .from('pending_nlp_confirmations')
      .delete()
      .lt('created_at', fiveMinutesAgo);

    if (error) {
      console.error('🔴 Cleanup error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`✅ Cleaned up ${count} expired pending confirmations`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${count} expired pending confirmations`,
    });
  } catch (error: any) {
    console.error('🔴 Cron cleanup error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
