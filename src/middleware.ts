import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'earthin_factory_session';
const AUTH_SECRET_STR =
  process.env.AUTH_SECRET || 'earthin_factory_dev_secret_replace_in_production_32chars!';
const AUTH_SECRET = new TextEncoder().encode(AUTH_SECRET_STR);

// Public routes accessible without authentication
const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  '/api/auth/login',
  '/api/neon/verify',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if the path is explicitly public
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  // 2. Read session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isAuthenticated = false;
  if (sessionToken) {
    try {
      const { payload } = await jwtVerify(sessionToken, AUTH_SECRET);
      if (payload && payload.userId) {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // 3. If authenticated user tries to open login or forgot-password, redirect to dashboard
  if (isAuthenticated && (pathname === '/login' || pathname === '/forgot-password')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. If path is public, allow access
  if (isPublic) {
    return NextResponse.next();
  }

  // 5. If not authenticated, block entry and enforce login
  if (!isAuthenticated) {
    // For API calls, return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: You must log into the Factory to access this endpoint.' },
        { status: 401 }
      );
    }

    // For web dashboard pages, redirect immediately to /login with redirect query param
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }

    const response = NextResponse.redirect(loginUrl);

    // If an invalid or expired cookie was present, clean it up
    if (sessionToken) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public image and asset extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
