import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// Store for one-time tokens (in production, use Redis)
const tokenStore = new Map<string, { userId: string; expiresAt: number }>();

// Clean up expired tokens every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [token, data] of tokenStore.entries()) {
      if (data.expiresAt < now) {
        tokenStore.delete(token);
      }
    }
  }, 60000);
}

/**
 * POST /api/auth/preview-token
 * Creates a one-time token for preview deployment session exchange
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate one-time token (valid for 60 seconds)
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60000; // 60 seconds

    tokenStore.set(token, { userId, expiresAt });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error creating preview token:', error);
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/preview-token?token=xxx
 * Exchanges a one-time token for user data
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token' },
        { status: 400 }
      );
    }

    // Get and remove token (one-time use)
    const data = tokenStore.get(token);
    if (!data) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    tokenStore.delete(token);

    // Check if token has expired
    if (data.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 401 }
      );
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error exchanging preview token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    );
  }
}
