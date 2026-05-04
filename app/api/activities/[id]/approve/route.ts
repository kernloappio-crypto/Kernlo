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
    console.log(`📌 Approving activity ${activityId} for user ${userData.user.id}`);

    // Verify activity belongs to user and is pending
    const { data: activity, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .eq('user_id', userData.user.id)
      .single();

    if (fetchError || !activity) {
      console.error(`🔴 Activity not found or unauthorized. Fetch error:`, fetchError);
      return NextResponse.json({ error: 'Activity not found or unauthorized' }, { status: 404 });
    }

    console.log(`📋 Found activity: id=${activity.id}, status=${activity.status}, user=${activity.user_id}`);

    if (activity.status !== 'pending') {
      console.warn(`⚠️ Activity status is '${activity.status}', not 'pending'`);
      return NextResponse.json({ error: 'Activity is not pending' }, { status: 400 });
    }

    // Update status to 'confirmed'
    console.log(`🔄 Updating activity ${activityId} to status='confirmed'...`);
    console.log(`🔐 RLS will check: user_id (${activity.user_id}) == auth.uid() (${userData.user.id})`);
    
    const { data, error } = await supabase
      .from('activities')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', activityId)
      .eq('user_id', userData.user.id)  // Explicit filter for safety, RLS enforces this
      .select();

    if (error) {
      console.error(`🔴 Approval update failed:`, error);
      console.error(`   Activity user_id: ${activity.user_id}, Authenticated user_id: ${userData.user.id}`);
      console.error(`   Do they match? ${activity.user_id === userData.user.id}`);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      console.error(`🔴 Update returned no rows. Possible RLS block or activity mismatch.`);
      console.error(`   Activity exists with user_id: ${activity.user_id}, Auth user: ${userData.user.id}`);
      return NextResponse.json({ error: 'Failed to update activity (RLS or auth issue)' }, { status: 400 });
    }

    console.log(`✅ Activity approved: id=${activityId}, new_status=${data[0].status}`);

    return NextResponse.json({ success: true, activity: data?.[0] });
  } catch (error: any) {
    console.error('🔴 Approve endpoint error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
