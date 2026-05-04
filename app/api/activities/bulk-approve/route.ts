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

interface BulkApproveBody {
  ids: string[];
}

/**
 * POST /api/activities/bulk-approve
 * Approve multiple pending activities at once
 * Body: { ids: [...] }
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const body: BulkApproveBody = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids array required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient(token);

    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update all activities to 'confirmed' (RLS will ensure they belong to user)
    const { data, error } = await supabase
      .from('activities')
      .update({ status: 'confirmed', is_completed: true })
      .in('id', ids)
      .eq('user_id', userData.user.id)
      .select();

    if (error) {
      console.error('🔴 Bulk approval error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`✅ Bulk approved ${data?.length || 0} activities`);

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      activities: data,
    });
  } catch (error: any) {
    console.error('🔴 Bulk approve endpoint error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
