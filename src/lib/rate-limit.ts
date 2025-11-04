import { getRedisClient } from './redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

export interface RateLimitConfig {
  /**
   * Unique identifier for this rate limit (e.g., IP address, user ID)
   */
  identifier: string;

  /**
   * Maximum number of requests allowed in the time window
   */
  limit: number;

  /**
   * Time window in seconds
   */
  window: number;

  /**
   * Optional prefix for the Redis key
   */
  prefix?: string;
}

/**
 * Check if a request is within rate limits using Redis
 * Uses a sliding window counter approach
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const redis = getRedisClient();

  // If Redis is not available, allow the request (graceful degradation)
  if (!redis) {
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      reset: Math.floor(Date.now() / 1000) + config.window,
    };
  }

  const { identifier, limit, window, prefix = 'ratelimit' } = config;
  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - window * 1000;

  try {
    // Use a sorted set to store requests with timestamps as scores
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const count = await redis.zcard(key);

    // Check if limit is exceeded
    if (count >= limit) {
      // Get the oldest request timestamp to calculate reset time
      const oldestRequests = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTimestamp = oldestRequests.length > 0
        ? parseInt(oldestRequests[1])
        : now;

      const resetTime = Math.floor((oldestTimestamp + window * 1000) / 1000);

      return {
        success: false,
        limit,
        remaining: 0,
        reset: resetTime,
      };
    }

    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiration on the key
    await redis.expire(key, window);

    // Calculate reset time (when the window expires)
    const reset = Math.floor(now / 1000) + window;

    return {
      success: true,
      limit,
      remaining: limit - (count + 1),
      reset,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);

    // On error, allow the request (fail open)
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.floor(Date.now() / 1000) + window,
    };
  }
}

/**
 * Rate limit for login attempts
 * 5 attempts per 15 minutes per identifier (IP or email)
 */
export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit({
    identifier,
    limit: 5,
    window: 15 * 60, // 15 minutes in seconds
    prefix: 'login',
  });
}

/**
 * Rate limit for API requests
 * Configurable per-user or per-IP limits
 */
export async function checkAPIRateLimit(
  identifier: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  return checkRateLimit({
    identifier,
    limit,
    window: windowSeconds,
    prefix: 'api',
  });
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or manual overrides
 */
export async function resetRateLimit(identifier: string, prefix: string = 'ratelimit'): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const key = `${prefix}:${identifier}`;
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Failed to reset rate limit:', error);
    return false;
  }
}

/**
 * Get current rate limit status without incrementing counter
 */
export async function getRateLimitStatus(
  identifier: string,
  limit: number,
  window: number,
  prefix: string = 'ratelimit'
): Promise<RateLimitResult> {
  const redis = getRedisClient();

  if (!redis) {
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.floor(Date.now() / 1000) + window,
    };
  }

  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - window * 1000;

  try {
    // Clean up old entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const count = await redis.zcard(key);
    const remaining = Math.max(0, limit - count);
    const reset = Math.floor(now / 1000) + window;

    return {
      success: remaining > 0,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.floor(Date.now() / 1000) + window,
    };
  }
}
