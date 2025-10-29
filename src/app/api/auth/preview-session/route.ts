import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';

/**
 * POST /api/auth/preview-session
 * Creates a session on preview deployment using a token from production
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    // Get production URL
    const productionUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prompteasy.ndsrf.com';

    // Exchange token for user data from production
    const response = await fetch(`${productionUrl}/api/auth/preview-token?token=${token}`);

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Invalid response' }));
      return NextResponse.json(
        { error: data.error || 'Failed to verify token' },
        { status: 401 }
      );
    }

    const { user } = await response.json();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 401 }
      );
    }

    // Verify user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create JWT session token using NextAuth's encode function
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const sessionToken = await encode({
      secret,
      token: {
        sub: dbUser.id,
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      },
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Set NextAuth session cookie
    const cookieStore = await cookies();
    const secureCookie = process.env.NODE_ENV === 'production';
    const cookieName = secureCookie
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    cookieStore.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({ success: true, user: dbUser });
  } catch (error) {
    console.error('Error creating preview session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
