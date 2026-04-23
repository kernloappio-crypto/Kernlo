import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { accessToken, userId } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token provided' }, { status: 400 });
    }

    // Log the token validation
    const parts = accessToken.split('.');
    let tokenInfo = { sub: 'unknown', exp: 'unknown', iat: 'unknown' };
    if (parts.length === 3) {
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      tokenInfo = {
        sub: decoded.sub,
        exp: decoded.exp,
        iat: decoded.iat,
      };
    }

    // Create Supabase client with the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Set the session with the provided token
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
    });

    if (sessionError) {
      return NextResponse.json(
        { 
          error: `setSession failed: ${sessionError.message}`,
          tokenInfo,
          userId,
        },
        { status: 400 }
      );
    }

    // Try to query kids (should work if RLS is OK)
    const { data: kidsData, error: kidsError } = await supabase
      .from('kids')
      .select('*')
      .eq('user_id', userId);

    // Try to query activities (the one that's failing)
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId);

    return NextResponse.json({
      tokenInfo,
      userId,
      sessionSet: !!sessionData?.session,
      kids: {
        success: !kidsError,
        count: kidsData?.length || 0,
        error: kidsError?.message,
        code: kidsError?.code,
        hint: kidsError?.hint,
        details: kidsError?.details,
      },
      activities: {
        success: !activitiesError,
        count: activitiesData?.length || 0,
        error: activitiesError?.message,
        code: activitiesError?.code,
        hint: activitiesError?.hint,
        details: activitiesError?.details,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
