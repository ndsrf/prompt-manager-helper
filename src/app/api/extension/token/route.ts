import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  createExtensionToken,
  getUserExtensionTokens,
  revokeExtensionToken,
} from '@/lib/extension-auth';
import { withAPIRateLimit } from '@/lib/api-rate-limit';

// GET /api/extension/token - List all extension tokens for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limit (100 req/min for authenticated users)
    const rateLimitCheck = await withAPIRateLimit(request, session.user.id);
    if (!rateLimitCheck.success) {
      return rateLimitCheck.response!;
    }

    const tokens = await getUserExtensionTokens(session.user.id);

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('[API] Error fetching extension tokens:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/extension/token - Create a new extension token
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limit (100 req/min for authenticated users)
    const rateLimitCheck = await withAPIRateLimit(request, session.user.id);
    if (!rateLimitCheck.success) {
      return rateLimitCheck.response!;
    }

    const body = await request.json();
    const { name, expiresInDays } = body;

    const extensionToken = await createExtensionToken(
      session.user.id,
      name,
      expiresInDays
    );

    return NextResponse.json({
      token: extensionToken.token,
      id: extensionToken.id,
      name: extensionToken.name,
      expiresAt: extensionToken.expiresAt,
    });
  } catch (error) {
    console.error('[API] Error creating extension token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/extension/token - Revoke an extension token
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limit (100 req/min for authenticated users)
    const rateLimitCheck = await withAPIRateLimit(request, session.user.id);
    if (!rateLimitCheck.success) {
      return rateLimitCheck.response!;
    }

    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('id');

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    await revokeExtensionToken(tokenId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error revoking extension token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
