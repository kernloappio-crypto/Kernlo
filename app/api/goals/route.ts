import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side goals endpoint
 * Handles auth properly with JWT token in Authorization header
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    // Create server-side Supabase client
    const supabase = createClient(
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

    // Query goals - RLS will automatically filter to current user
    const { data, error } = await supabase
      .from('goals')
      .select('*');

    if (error) {
      console.error('Goals query error:', error);
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

    return NextResponse.json({ goals: data });
  } catch (error: any) {
    console.error('Goals endpoint error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
