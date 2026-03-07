/**
 * Auth API Routes
 * Login, logout, profile endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock user database
const MOCK_USERS = {
  'admin@queclaw.com': {
    id: '1',
    email: 'admin@queclaw.com',
    name: 'Admin User',
    role: 'super_admin',
  },
};

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/login')) {
    const { email, password } = await request.json();

    const user = MOCK_USERS[email as keyof typeof MOCK_USERS];
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    const response = NextResponse.json({
      user,
      token,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      maxAge: 86400,
    });
    response.cookies.set('user_role', user.role, {
      maxAge: 86400,
    });

    return response;
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  if (url.pathname.includes('/me')) {
    const token = request.cookies.get('auth_token')?.value;
    const userRole = request.cookies.get('user_role')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // In a real app, verify the token
    const user = {
      id: '1',
      email: 'admin@queclaw.com',
      name: 'Admin User',
      role: userRole,
    };

    return NextResponse.json({
      user,
      token,
    });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
