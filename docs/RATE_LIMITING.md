# Rate Limiting Implementation

## Overview

PromptEasy implements rate limiting using Redis to protect against abuse and ensure fair usage of API resources. The rate limiting system is designed with graceful degradation - if Redis is unavailable, the application will continue to work without rate limiting.

## Features

- **Login Rate Limiting**: Prevents brute force attacks by limiting login attempts
- **API Request Throttling**: Controls API usage based on user subscription tier
- **Graceful Degradation**: System works without Redis (rate limiting disabled)
- **Flexible Configuration**: Easy to adjust limits and time windows
- **Sliding Window**: Uses sorted sets for accurate sliding window rate limiting

## Architecture

### Components

1. **Redis Client** (`src/lib/redis.ts`)
   - Manages Redis connection
   - Health checks and error handling
   - Automatic reconnection

2. **Rate Limiting Core** (`src/lib/rate-limit.ts`)
   - Sliding window algorithm using Redis sorted sets
   - Generic rate limiting functions
   - Specialized helpers for login and API rate limiting

3. **API Middleware** (`src/lib/api-rate-limit.ts`)
   - Next.js API route middleware
   - Rate limit tier management
   - HTTP header injection

4. **tRPC Integration** (`src/server/api/trpc.ts`)
   - Rate limiting middleware for tRPC procedures
   - Automatic IP and user identification

## Rate Limit Tiers

| Tier | Requests per Minute | Use Case |
|------|---------------------|----------|
| Anonymous | 20 | Unauthenticated requests |
| Free | 100 | Authenticated users on free tier |
| Pro | 500 | Pro subscription users |
| Enterprise | 2000 | Enterprise subscription users |

### Login Rate Limiting

- **Limit**: 5 attempts per 15 minutes
- **Identifier**: Email address (case-insensitive)
- **Purpose**: Prevent brute force attacks on user accounts

## Implementation Details

### How It Works

1. **Request Received**: User makes a request (login or API call)
2. **Identifier Extraction**: System extracts identifier (user ID, IP address, or email)
3. **Redis Check**: Query Redis to check current request count in time window
4. **Allow/Deny**:
   - If within limit: Allow request and increment counter
   - If exceeds limit: Return 429 Too Many Requests with retry time
5. **Graceful Fallback**: If Redis is unavailable, allow request

### Sliding Window Algorithm

The implementation uses Redis sorted sets to implement a sliding window:

```
Key: ratelimit:{identifier}
Value: Sorted set of {timestamp}-{random} scored by timestamp
```

1. Remove entries older than the time window
2. Count remaining entries
3. If count < limit, add new entry
4. Set key expiration to window duration

**Advantages:**
- Accurate sliding window (not fixed window)
- Prevents burst traffic at window boundaries
- Automatic cleanup via Redis expiration

## Usage

### 1. Setting Up Redis

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Configuration:**
```env
# .env
REDIS_URL="redis://localhost:6379"

# With password:
REDIS_URL="redis://:your_password@localhost:6379"

# Redis Cloud:
REDIS_URL="redis://:password@redis-12345.cloud.redislabs.com:12345"
```

### 2. Login Rate Limiting

Login rate limiting is automatically applied in the NextAuth credentials provider.

**Location**: `src/lib/auth.ts`

```typescript
import { checkLoginRateLimit } from './rate-limit';

// In authorize function:
const rateLimitResult = await checkLoginRateLimit(credentials.email.toLowerCase());

if (!rateLimitResult.success) {
  throw new Error('Too many login attempts. Please try again later.');
}
```

**User Experience:**
- First 5 attempts: Normal behavior
- 6th attempt within 15 min: Error message with wait time
- After 15 min: Counter resets automatically

### 3. API Route Rate Limiting

For Next.js API routes, use the `withAPIRateLimit` helper:

```typescript
import { withAPIRateLimit } from '@/lib/api-rate-limit';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getServerSession();

  // Check rate limit
  const rateLimitCheck = await withAPIRateLimit(
    request,
    session?.user?.id,
    { limit: 100, window: 60 } // optional
  );

  if (!rateLimitCheck.success) {
    return rateLimitCheck.response!; // 429 response
  }

  // Process request...
}
```

### 4. tRPC Procedures

Rate limiting is automatically applied to all tRPC procedures:

```typescript
// Public procedures: 20 req/min (anonymous)
export const publicProcedure = t.procedure.use(enforceRateLimit);

// Protected procedures: 100 req/min (authenticated)
export const protectedProcedure = t.procedure
  .use(enforceRateLimit)
  .use(enforceUserIsAuthed);
```

No additional code needed - rate limiting is automatic!

### 5. Custom Rate Limiting

For custom rate limits:

```typescript
import { checkRateLimit } from '@/lib/rate-limit';

const result = await checkRateLimit({
  identifier: 'custom-action:user123',
  limit: 10,
  window: 300, // 5 minutes in seconds
  prefix: 'custom'
});

if (!result.success) {
  // Rate limit exceeded
  console.log(`Try again in ${result.reset - Date.now()/1000} seconds`);
}
```

## Response Headers

Rate-limited API responses include these headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698765432
```

- `X-RateLimit-Limit`: Maximum requests allowed in window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets

**429 Response:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 1698765432
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1698765432

{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again after 2023-10-31T12:30:32.000Z",
  "retryAfter": 1698765432
}
```

## Testing

### Manual Testing

Test the rate limiting implementation:

```bash
npx tsx src/test-rate-limit.ts
```

**Output:**
```
=== Rate Limiting Test ===

1. Checking Redis connection...
   Redis available: true

2. Testing login rate limiting (5 attempts per 15 minutes)...
   Attempt 1: ✅ Allowed (remaining: 4/5)
   Attempt 2: ✅ Allowed (remaining: 3/5)
   Attempt 3: ✅ Allowed (remaining: 2/5)
   Attempt 4: ✅ Allowed (remaining: 1/5)
   Attempt 5: ✅ Allowed (remaining: 0/5)
   Attempt 6: ❌ Blocked (remaining: 0/5)
   ⏰ Rate limit will reset in 15 minutes

3. Testing API rate limiting (100 requests per minute)...
   Making 100 API requests...
   Request 1: ✅ Allowed (remaining: 99/100)
   Request 50: ✅ Allowed (remaining: 50/100)
   Request 100: ✅ Allowed (remaining: 0/100)
   Request 101: ❌ Blocked (remaining: 0/100)
```

### Integration Testing

Rate limiting tests are included in the test suite. Run with:

```bash
npm test
```

Mock context in tests includes rate limiting infrastructure:

```typescript
import { createMockContext } from '@/server/api/test-utils';

const ctx = createMockContext(); // Includes headers and req for rate limiting
```

## Monitoring

### Redis Keys

Rate limit data is stored in Redis with these key patterns:

```
login:{email}               # Login attempts by email
api:user:{userId}          # API requests by user
api:ip:{ipAddress}         # API requests by IP
custom:{identifier}        # Custom rate limits
```

**View keys in Redis:**
```bash
redis-cli
> KEYS login:*
> KEYS api:*
> ZRANGE login:test@example.com 0 -1 WITHSCORES
```

### Health Check

Check Redis connectivity:

```typescript
import { isRedisAvailable } from '@/lib/redis';

const available = await isRedisAvailable();
console.log('Redis available:', available);
```

### Logs

Rate limiting logs include:

- Redis connection events (connect, error, close)
- Rate limit check failures
- Graceful degradation warnings

**Example logs:**
```
Redis connected successfully
Redis ready to accept commands
Rate limit check failed: Error: Connection timeout
REDIS_URL not configured - rate limiting will be disabled
```

## Troubleshooting

### Redis Not Connecting

**Symptoms:**
- Warning: "REDIS_URL not configured"
- Rate limiting disabled

**Solutions:**
1. Check Redis is running: `redis-cli ping` (should return PONG)
2. Verify `REDIS_URL` in `.env` file
3. Check Redis port is accessible: `telnet localhost 6379`
4. Review Redis logs: `docker logs redis`

### Rate Limit Too Restrictive

**Adjust limits:**

1. **Login attempts** - Edit `src/lib/rate-limit.ts`:
   ```typescript
   export async function checkLoginRateLimit(identifier: string) {
     return checkRateLimit({
       identifier,
       limit: 10,        // Increase from 5 to 10
       window: 15 * 60,  // Keep 15 minutes
       prefix: 'login',
     });
   }
   ```

2. **API tier limits** - Edit `src/lib/api-rate-limit.ts`:
   ```typescript
   export const RATE_LIMIT_TIERS = {
     FREE: {
       limit: 200,   // Increase from 100 to 200
       window: 60,
     },
     // ...
   };
   ```

### Reset Rate Limit for User

Manually reset a user's rate limit:

```typescript
import { resetRateLimit } from '@/lib/rate-limit';

// Reset login attempts
await resetRateLimit('user@example.com', 'login');

// Reset API requests
await resetRateLimit('user:userId123', 'api');
```

Or via Redis CLI:
```bash
redis-cli DEL "login:user@example.com"
redis-cli DEL "api:user:userId123"
```

### Production Deployment

**Recommendations:**

1. **Use Redis Cloud** or managed Redis service
2. **Enable persistence** for rate limit data across restarts
3. **Monitor Redis metrics**: memory usage, connection count, command latency
4. **Set up alerts** for Redis unavailability
5. **Configure backups** (optional - rate limit data is ephemeral)

**Redis Cloud setup:**
```env
REDIS_URL="rediss://default:password@redis-12345.cloud.redislabs.com:12345"
```

## Security Considerations

1. **IP Spoofing**: Rate limiting by IP uses `X-Forwarded-For` header
   - Ensure your reverse proxy (nginx, CloudFlare) sets this correctly
   - Consider additional validation in high-security environments

2. **Distributed Denial of Service**: Rate limiting helps but is not a complete DDoS solution
   - Consider CloudFlare or similar CDN for DDoS protection
   - Implement additional IP-based blocking at network level

3. **Redis Security**:
   - Always use password authentication in production
   - Use TLS connections (rediss://) for cloud Redis
   - Restrict Redis network access to application servers only

4. **Graceful Degradation**: System allows requests when Redis is down
   - This is intentional to avoid outages
   - Monitor Redis availability closely
   - Consider fail-closed behavior for critical endpoints

## Performance

**Benchmarks** (on typical hardware):

- Rate limit check latency: ~2-5ms
- Redis operations per request: 3-4
- Memory per identifier: ~100-200 bytes
- Memory for 10,000 users (1 min window): ~1-2 MB

**Optimization tips:**

1. Use shorter time windows where possible
2. Clean up old keys regularly (automatic via expiration)
3. Monitor Redis memory usage
4. Consider sharding for very high traffic

## Future Enhancements

Potential improvements:

- [ ] Dynamic rate limits based on load
- [ ] Rate limit by API endpoint (different limits per route)
- [ ] Admin dashboard for rate limit monitoring
- [ ] Webhook notifications for rate limit violations
- [ ] Allowlist/blocklist management
- [ ] Distributed rate limiting across multiple servers

## References

- [Redis Rate Limiting Patterns](https://redis.io/docs/manual/patterns/distributed-locks/)
- [IETF Rate Limit Headers Draft](https://datatracker.ietf.org/doc/html/draft-polli-ratelimit-headers)
- [tRPC Middleware Documentation](https://trpc.io/docs/server/middlewares)

## Support

For issues or questions:
- Check troubleshooting section above
- Review Redis logs
- Check application logs for rate limiting warnings
- File an issue on GitHub

---

**Last Updated**: October 2025
**Version**: 1.0.0
