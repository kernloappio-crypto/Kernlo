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
 * Fetch unique days logged in current week AND month for a specific child
 * Returns: { daysLogged: number, weeklyTarget: number, monthlyDaysLogged: number, daysInMonth: number, weekStart, weekEnd, monthStart, monthEnd }
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ childId: string }> }
) {
  const { params } = context;
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

    const { childId } = await params;
    
    // Get child name from childId
    const { data: kidData } = await supabase
      .from('kids')
      .select('name')
      .eq('id', childId)
      .single();
    
    if (!kidData) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }
    
    const childName = kidData.name;

    // ============ WEEKLY DATA ============
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate Monday of current week
    const daysToSubtract = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(monday.getDate() - daysToSubtract);
    monday.setHours(0, 0, 0, 0);

    // Calculate Sunday (end of week = Monday + 6 days)
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = sunday.toISOString().split('T')[0];

    // ============ MONTHLY DATA ============
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const monthEndStr = monthEnd.toISOString().split('T')[0];
    const daysInMonth = monthEnd.getDate(); // Get the last day of the month

    console.log(`📅 Week range: ${weekStart} to ${weekEnd}`);
    console.log(`📅 Month range: ${monthStartStr} to ${monthEndStr} (${daysInMonth} days)`);

    // Query confirmed activities for this specific child in the current week
    const { data: weekData, error: weekError } = await supabase
      .from('activities')
      .select('date, id')
      .eq('user_id', userData.user.id)
      .eq('child_name', childName)
      .eq('status', 'confirmed')
      .gte('date', weekStart)
      .lte('date', weekEnd);

    if (weekError) {
      console.error('🔴 Weekly consistency query error:', weekError);
      return NextResponse.json(
        { error: weekError.message },
        { status: 400 }
      );
    }

    // Get unique days for the week
    const weekUniqueDays = new Set<string>();
    if (weekData) {
      weekData.forEach((activity) => {
        if (activity.date) {
          weekUniqueDays.add(activity.date);
        }
      });
    }

    const daysLogged = weekUniqueDays.size;
    const weeklyTarget = 5;

    // Query confirmed activities for this specific child in the current month
    const { data: monthData, error: monthError } = await supabase
      .from('activities')
      .select('date, id')
      .eq('user_id', userData.user.id)
      .eq('child_name', childName)
      .eq('status', 'confirmed')
      .gte('date', monthStartStr)
      .lte('date', monthEndStr);

    if (monthError) {
      console.error('🔴 Monthly consistency query error:', monthError);
      return NextResponse.json(
        { error: monthError.message },
        { status: 400 }
      );
    }

    // Get unique days for the month
    const monthUniqueDays = new Set<string>();
    if (monthData) {
      monthData.forEach((activity) => {
        if (activity.date) {
          monthUniqueDays.add(activity.date);
        }
      });
    }

    const monthlyDaysLogged = monthUniqueDays.size;

    console.log(
      `✅ Consistency for child ${childId}: ${daysLogged}/${weeklyTarget} days this week, ${monthlyDaysLogged}/${daysInMonth} days this month`
    );

    return NextResponse.json({
      daysLogged,
      weeklyTarget,
      monthlyDaysLogged,
      daysInMonth,
      weekStart,
      weekEnd,
      monthStart: monthStartStr,
      monthEnd: monthEndStr,
    });
  } catch (error: any) {
    console.error('🔴 Consistency endpoint error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
