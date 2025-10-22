import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { validateExtensionToken } from './extension-auth';

export interface AuthContext {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  authType: 'session' | 'extension-token';
}

/**
 * Get authenticated user from either NextAuth session or extension token
 * This allows both web app (with session cookies) and extension (with bearer tokens) to authenticate
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthContext | null> {
  // First try to get user from NextAuth session (for web app)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      authType: 'session',
    };
  }

  // If no session, check for extension token in Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = await validateExtensionToken(token);

    if (user) {
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        authType: 'extension-token',
      };
    }
  }

  return null;
}
