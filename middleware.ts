import { NextRequest, NextResponse } from 'next/server';

// DISABLED: Middleware was causing dirname error on Vercel edge runtime
// Auth is handled client-side via Supabase session in localStorage
// This middleware was just passing through anyway

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Disable for now - not needed for auth flow
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
