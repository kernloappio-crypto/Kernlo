import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Decode JWT token manually (without external library)
 */
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    // Decode from base64url to string
    const decoded = Buffer.from(padded, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch (err) {
    throw new Error(`JWT decode failed: ${err}`);
  }
}

/**
 * GET /api/courses?kid_id={id}
 * Returns courses for a kid
 * Requires Bearer token (JWT from localStorage)
 * Extracts user_id from JWT and validates ownership via RLS
 */
export async function GET(req: NextRequest) {
  try {
    // Extract Bearer token
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token' },
        { status: 401 }
      );
    }

    // Extract kid_id from query params
    const { searchParams } = new URL(req.url);
    const kidId = searchParams.get('kid_id');

    if (!kidId) {
      return NextResponse.json(
        { error: 'Missing kid_id parameter' },
        { status: 400 }
      );
    }

    // Decode JWT to extract user_id
    let userId: string;
    try {
      const decoded = decodeJWT(token);
      userId = decoded.sub; // JWT 'sub' claim contains user_id
      if (!userId) {
        throw new Error('No user_id in token');
      }
    } catch (err) {
      console.error('JWT decode error:', err);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Create server-side Supabase client with the user's token
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

    // Query courses - RLS policy will enforce user_id ownership
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('kid_id', kidId)
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('semester', { ascending: false });

    if (error) {
      console.error('Courses query error:', error);
      
      // Return empty array if forbidden (RLS check failed)
      if (error.code === 'PGRST116' || error.message?.includes('permission')) {
        return NextResponse.json({ courses: [] }, { status: 200 });
      }

      return NextResponse.json(
        { error: error.message || 'Failed to fetch courses' },
        { status: 500 }
      );
    }

    return NextResponse.json({ courses: data || [] }, { status: 200 });
  } catch (error: any) {
    console.error('Courses endpoint error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
