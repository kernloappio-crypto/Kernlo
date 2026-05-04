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
 * PUT /api/activities/[id]
 * Update activity fields (child_name, subject, duration, etc.)
 */
export async function PUT(
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

    const body = await req.json();
    const { id } = await params;
    const activityId = id;

    // Verify activity belongs to user
    const { data: activity, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .eq('user_id', userData.user.id)
      .single();

    if (fetchError || !activity) {
      return NextResponse.json({ error: 'Activity not found or unauthorized' }, { status: 404 });
    }

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.child_name !== undefined) updateData.child_name = body.child_name;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.platform !== undefined) updateData.platform = body.platform;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.curriculum !== undefined) updateData.curriculum = body.curriculum;
    if (body.activity_type !== undefined) updateData.activity_type = body.activity_type;

    // Update activity
    const { data, error } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', activityId)
      .select();

    if (error) {
      console.error('🔴 Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('✅ Activity updated:', activityId);

    return NextResponse.json({ success: true, activity: data?.[0] });
  } catch (error: any) {
    console.error('🔴 Update endpoint error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

/**
 * DELETE /api/activities/[id]
 * Delete an activity
 */
export async function DELETE(
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

    // Verify activity belongs to user
    const { data: activity, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .eq('user_id', userData.user.id)
      .single();

    if (fetchError || !activity) {
      return NextResponse.json({ error: 'Activity not found or unauthorized' }, { status: 404 });
    }

    // Delete activity
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) {
      console.error('🔴 Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('✅ Activity deleted:', activityId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('🔴 Delete endpoint error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
