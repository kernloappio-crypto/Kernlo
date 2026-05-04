import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

/**
 * GET /api/consistency/[childId]?week=current
 * Fetch unique days logged in current week for a specific child
 * Returns: { daysLogged: number, target: number }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const supabase = getSupabaseClient(token);

    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const childId = params.childId;

    // Get current week boundaries (Monday-Sunday)
    // If today is Monday, week starts today
    // If today is Sunday, week ends today
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate Monday of current week
    const daysUntilMonday = currentDayOfWeek === 0 ? 1 : currentDayOfWeek === 1 ? 0 : (8 - currentDayOfWeek);
    const monday = new Date(now);
    monday.setDate(monday.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);

    // Calculate Sunday (end of week)
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = sunday.toISOString().split('T')[0];

    console.log(`📅 Week range: ${weekStart} to ${weekEnd}`);

    // Query confirmed activities for this child in the current week
    const { data, error } = await supabase
      .from('activities')
      .select('date, id')
      .eq('user_id', userData.user.id)
      .eq('status', 'confirmed')
      .gte('date', weekStart)
      .lte('date', weekEnd);

    if (error) {
      console.error('🔴 Consistency query error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Get unique days (distinct dates)
    const uniqueDays = new Set<string>();
    if (data) {
      data.forEach((activity) => {
        if (activity.date) {
          uniqueDays.add(activity.date);
        }
      });
    }

    const daysLogged = uniqueDays.size;
    const target = 5;

    console.log(
      `✅ Consistency for child ${childId}: ${daysLogged}/${target} days`
    );

    return NextResponse.json({
      daysLogged,
      target,
      weekStart,
      weekEnd,
    });
  } catch (error: any) {
    console.error('🔴 Consistency endpoint error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
