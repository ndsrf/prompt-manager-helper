import { NextRequest, NextResponse } from 'next/server';
import { checkAPIRateLimit, type RateLimitResult } from './rate-limit';

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(req: NextRequest | Request, userId?: string): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown';

  return `ip:${ip}`;
}

/**
 * Apply rate limit headers to response
 */
export function addRateLimitHeaders(response: Response, result: RateLimitResult): Response {
  const headers = new Headers(response.headers);

  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());

  // Create new response with updated headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Middleware to check API rate limits
 * Returns NextResponse with rate limit headers
 */
export async function withAPIRateLimit(
  req: NextRequest | Request,
  userId?: string,
  options?: {
    limit?: number;
    window?: number;
  }
): Promise<{ success: boolean; response?: NextResponse; result: RateLimitResult }> {
  const identifier = getClientIdentifier(req, userId);
  const limit = options?.limit ?? 100;
  const window = options?.window ?? 60;

  const result = await checkAPIRateLimit(identifier, limit, window);

  if (!result.success) {
    const resetDate = new Date(result.reset * 1000);
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again after ${resetDate.toISOString()}`,
        retryAfter: result.reset,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': result.reset.toString(),
        },
      }
    );

    return { success: false, response, result };
  }

  return { success: true, result };
}

/**
 * Rate limit tiers based on user subscription level
 */
export const RATE_LIMIT_TIERS = {
  FREE: {
    limit: 100,
    window: 60, // 100 requests per minute
  },
  PRO: {
    limit: 500,
    window: 60, // 500 requests per minute
  },
  ENTERPRISE: {
    limit: 2000,
    window: 60, // 2000 requests per minute
  },
  ANONYMOUS: {
    limit: 20,
    window: 60, // 20 requests per minute for unauthenticated users
  },
} as const;

/**
 * Get rate limit tier for a user based on subscription
 */
export function getRateLimitTier(userTier?: 'FREE' | 'PRO' | 'ENTERPRISE'): { limit: number; window: number } {
  if (!userTier) {
    return RATE_LIMIT_TIERS.ANONYMOUS;
  }
  return RATE_LIMIT_TIERS[userTier] || RATE_LIMIT_TIERS.FREE;
}
