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
    console.log('[API /courses] Request received');
    
    // Extract Bearer token
    const authHeader = req.headers.get('Authorization');
    console.log('[API /courses] Auth header present:', !!authHeader);
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.error('[API /courses] No token provided');
      return NextResponse.json(
        { error: 'No authorization token' },
        { status: 401 }
      );
    }

    // Extract kid_id from query params
    const { searchParams } = new URL(req.url);
    const kidId = searchParams.get('kid_id');
    console.log('[API /courses] kidId from params:', kidId);

    if (!kidId) {
      console.error('[API /courses] Missing kid_id');
      return NextResponse.json(
        { error: 'Missing kid_id parameter' },
        { status: 400 }
      );
    }

    // Decode JWT to extract user_id
    let userId: string;
    try {
      console.log('[API /courses] Decoding JWT token...');
      const decoded = decodeJWT(token);
      console.log('[API /courses] Decoded JWT:', { sub: decoded.sub, email: decoded.email });
      userId = decoded.sub; // JWT 'sub' claim contains user_id
      if (!userId) {
        throw new Error('No user_id in token');
      }
    } catch (err) {
      console.error('[API /courses] JWT decode error:', err);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Create server-side Supabase client with the user's token
    console.log('[API /courses] Creating Supabase client...');
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
    console.log('[API /courses] Querying courses for:', { kidId, userId });
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('kid_id', kidId)
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('semester', { ascending: false });

    console.log('[API /courses] Query result - data count:', data?.length || 0, 'error:', error?.message);

    if (error) {
      console.error('[API /courses] Courses query error:', error);
      
      // Return empty array if forbidden (RLS check failed)
      if (error.code === 'PGRST116' || error.message?.includes('permission')) {
        console.log('[API /courses] RLS denied - returning empty array');
        return NextResponse.json({ courses: [] }, { status: 200 });
      }

      return NextResponse.json(
        { error: error.message || 'Failed to fetch courses' },
        { status: 500 }
      );
    }

    console.log('[API /courses] Success - returning courses');
    if (data && data.length > 0) {
      console.log('[API /courses] Sample course:', JSON.stringify(data[0], null, 2));
    }
    
    return NextResponse.json({ courses: data || [] }, { status: 200 });
  } catch (error: any) {
    console.error('[API /courses] Endpoint error:', error);
    console.error('[API /courses] Error message:', error?.message);
    console.error('[API /courses] Error stack:', error?.stack);
    return NextResponse.json(
      { error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
