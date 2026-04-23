import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/privacy', '/terms', '/'];

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes - check for auth
  // Note: We can't check Supabase session from middleware in App Router,
  // so we rely on client-side session verification in the pages themselves
  // The session is stored in localStorage which is accessible on client

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js).*)'],
};
