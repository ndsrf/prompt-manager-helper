import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * Get or create Redis client instance
 * Returns null if Redis is not configured (graceful degradation)
 */
export function getRedisClient(): Redis | null {
  // If REDIS_URL is not set, return null (graceful degradation)
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not configured - rate limiting and caching will be disabled');
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError(err) {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            // Only reconnect when the error contains "READONLY"
            return true;
          }
          return false;
        },
      });

      redis.on('error', (err) => {
        console.error('Redis error:', err);
      });

      redis.on('connect', () => {
        console.log('Redis connected successfully');
      });

      redis.on('ready', () => {
        console.log('Redis ready to accept commands');
      });

      redis.on('close', () => {
        console.warn('Redis connection closed');
      });
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      return null;
    }
  }

  return redis;
}

/**
 * Close Redis connection (for cleanup/testing)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}
