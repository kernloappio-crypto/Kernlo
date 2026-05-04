import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ActivityCreatePayload } from '@/lib/types';

/**
 * Server-side activities endpoint
 * Supports GET (list) and POST (create) operations
 */

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

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const supabase = getSupabaseClient(token);

    // Query activities - Filter by status
    // Default: Only return confirmed (for hour totals)
    // ?status=all: Return all activities (internal use only)
    const url = new URL(req.url);
    const statusParam = url.searchParams.get('status');
    const onlyConfirmed = statusParam !== 'all';

    let query = supabase.from('activities').select('*');

    if (onlyConfirmed) {
      query = query.eq('status', 'confirmed');
    }

    const { data, error } = await query;

    if (error) {
      console.error('🔴 Activities query error:', error);
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ activities: data });
  } catch (error: any) {
    console.error('🔴 Activities endpoint error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const body: ActivityCreatePayload = await req.json();
    const { child_name, subject, duration, platform, date, notes, status, raw_input } = body;

    if (!child_name || !subject || !duration || !platform || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: child_name, subject, duration, platform, date' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient(token);

    // Get current user ID from JWT (via auth.uid())
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.error('🔴 Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user_id = userData.user.id;

    // Default status to 'confirmed' if not provided (manual Quick Log)
    // If status is provided from CommandBar, use 'pending'
    const activityStatus = status || 'confirmed';

    // Insert activity with status and raw_input
    const { data, error } = await supabase.from('activities').insert({
      user_id,
      child_name,
      subject,
      duration,
      platform,
      date,
      notes: notes || null,
      status: activityStatus,
      raw_input: raw_input || null,
    });

    if (error) {
      console.error('🔴 Activity insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.log('✅ Activity logged:', { child_name, subject, duration, platform, status: activityStatus });

    return NextResponse.json({ success: true, activity: data }, { status: 201 });
  } catch (error: any) {
    console.error('🔴 Activity create endpoint error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
