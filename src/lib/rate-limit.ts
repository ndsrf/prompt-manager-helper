/**
 * Rate Limiting Utility
 *
 * Implements a token bucket algorithm for rate limiting API requests.
 * Uses in-memory storage (can be enhanced with Redis for production).
 */

export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in the interval
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limit data
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Array.from(rateLimitStore.entries())) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  AUTH_LOGIN: { interval: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  AUTH_REGISTER: { interval: 60 * 60 * 1000, maxRequests: 3 }, // 3 attempts per hour
  AUTH_RESET_PASSWORD: { interval: 60 * 60 * 1000, maxRequests: 3 }, // 3 attempts per hour

  // API endpoints
  API_GENERAL: { interval: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
  API_AI_IMPROVE: { interval: 60 * 60 * 1000, maxRequests: 10 }, // 10 AI improvements per hour (free tier)
  API_AI_IMPROVE_PRO: { interval: 60 * 60 * 1000, maxRequests: 100 }, // 100 AI improvements per hour (pro tier)

  // Export/Import
  API_EXPORT: { interval: 60 * 1000, maxRequests: 10 }, // 10 exports per minute
  API_IMPORT: { interval: 60 * 1000, maxRequests: 5 }, // 5 imports per minute

  // High-frequency operations
  API_READ: { interval: 60 * 1000, maxRequests: 120 }, // 120 reads per minute
  API_WRITE: { interval: 60 * 1000, maxRequests: 30 }, // 30 writes per minute
} as const;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp when the limit resets
}

/**
 * Check if a request is within rate limits
 *
 * @param identifier - Unique identifier for the rate limit (e.g., user ID, IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}`;

  let entry = rateLimitStore.get(key);

  // If no entry exists or the reset time has passed, create a new entry
  if (!entry || entry.resetTime <= now) {
    entry = {
      count: 0,
      resetTime: now + config.interval,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment the request count
  entry.count++;

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const success = entry.count <= config.maxRequests;

  return {
    success,
    limit: config.maxRequests,
    remaining,
    reset: entry.resetTime,
  };
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or manual override
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}`;

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime <= now) {
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: now + config.interval,
    };
  }

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const success = entry.count < config.maxRequests;

  return {
    success,
    limit: config.maxRequests,
    remaining,
    reset: entry.resetTime,
  };
}

/**
 * Middleware helper for tRPC procedures
 *
 * Usage:
 * ```typescript
 * .use(rateLimitMiddleware(RATE_LIMITS.API_GENERAL))
 * ```
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async ({ ctx, next }: any) => {
    // Get identifier from context (user ID or IP address)
    const identifier = ctx.session?.user?.id || ctx.ip || 'anonymous';

    const result = checkRateLimit(identifier, config);

    if (!result.success) {
      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil(
          (result.reset - Date.now()) / 1000
        )} seconds.`
      );
    }

    // Add rate limit info to response headers (if applicable)
    if (ctx.res) {
      ctx.res.setHeader('X-RateLimit-Limit', result.limit.toString());
      ctx.res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      ctx.res.setHeader('X-RateLimit-Reset', result.reset.toString());
    }

    return next();
  };
}

/**
 * Get tier-specific AI improvement rate limit
 */
export function getAiImprovementLimit(tier: string): RateLimitConfig {
  if (tier === 'pro' || tier === 'enterprise') {
    return RATE_LIMITS.API_AI_IMPROVE_PRO;
  }
  return RATE_LIMITS.API_AI_IMPROVE;
}

/**
 * Express/Next.js middleware for API routes
 */
export function rateLimitApiMiddleware(config: RateLimitConfig) {
  return (req: any, res: any, next: any) => {
    // Get identifier from request (user session or IP)
    const identifier =
      req.session?.user?.id ||
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      'anonymous';

    const result = checkRateLimit(identifier, config);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.reset.toString());

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      });
    }

    next();
  };
}
