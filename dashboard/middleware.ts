/**
 * Next.js Middleware for Authentication & RBAC
 * Runs on all requests to enforce auth and role-based access
 */

import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/'];

// Routes that require specific roles
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/logs': ['super_admin', 'admin'],
  '/feature-flags': ['super_admin'],
  '/commands': ['super_admin'],
  '/bot-monitor': ['super_admin', 'admin'],
  '/fraud': ['super_admin', 'admin'],
  '/api-keys': ['super_admin', 'admin'],
  '/users': ['super_admin', 'admin', 'support'],
  '/subscriptions': ['super_admin', 'admin', 'finance'],
  '/payments': ['super_admin', 'admin', 'finance'],
  '/conversations': ['super_admin', 'admin', 'support'],
  '/broadcast': ['super_admin', 'admin'],
  '/analytics': ['super_admin', 'admin', 'support', 'finance'],
  '/settings': ['super_admin', 'admin'],
  '/dashboard': ['super_admin', 'admin', 'support', 'finance'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Get auth token from cookies
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // If no auth token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check route-level role access
  const routeRoles = PROTECTED_ROUTES[pathname];
  
  if (routeRoles && userRole && !routeRoles.includes(userRole)) {
    // User doesn't have permission for this route
    const forbiddenUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(forbiddenUrl);
  }

  // Add headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-role', userRole || '');
  response.headers.set('x-auth-token', token);

  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
