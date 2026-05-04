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
 * GET /api/activities/heatmap?year=2026
 * Fetch confirmed activities grouped by date for heatmap visualization
 * Returns: { date: string, count: number }[]
 */
export async function GET(req: NextRequest) {
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

    // Get year from query params (default to current year)
    const year = req.nextUrl.searchParams.get('year') || new Date().getFullYear().toString();

    // Query all confirmed activities for current user in the given year
    const { data, error } = await supabase
      .from('activities')
      .select('date, id')
      .eq('user_id', userData.user.id)
      .eq('status', 'confirmed')
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
      .order('date', { ascending: true });

    if (error) {
      console.error('🔴 Heatmap query error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Group by date and count activities
    const activityCountByDate: { [date: string]: number } = {};

    if (data) {
      data.forEach((activity) => {
        if (activity.date) {
          activityCountByDate[activity.date] = (activityCountByDate[activity.date] || 0) + 1;
        }
      });
    }

    // Convert to array format for heatmap
    const heatmapData = Object.entries(activityCountByDate).map(([date, count]) => ({
      date,
      count,
    }));

    console.log('✅ Heatmap data ready:', heatmapData.length, 'days with activities');

    return NextResponse.json({ heatmapData });
  } catch (error: any) {
    console.error('🔴 Heatmap endpoint error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
