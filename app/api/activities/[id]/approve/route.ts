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
 * POST /api/activities/[id]/approve
 * Approve a single pending activity (sets status to 'confirmed')
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const activityId = id;

    // Verify activity belongs to user and is pending
    const { data: activity, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .eq('user_id', userData.user.id)
      .single();

    if (fetchError || !activity) {
      return NextResponse.json({ error: 'Activity not found or unauthorized' }, { status: 404 });
    }

    if (activity.status !== 'pending') {
      return NextResponse.json({ error: 'Activity is not pending' }, { status: 400 });
    }

    // Update status to 'confirmed'
    const { data, error } = await supabase
      .from('activities')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', activityId)
      .select();

    if (error) {
      console.error('🔴 Approval error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('✅ Activity approved:', activityId);

    return NextResponse.json({ success: true, activity: data?.[0] });
  } catch (error: any) {
    console.error('🔴 Approve endpoint error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
