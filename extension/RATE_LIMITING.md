# Chrome Extension Rate Limiting

## Overview

The PromptEasy Chrome extension has been updated to handle API rate limiting gracefully. This ensures a smooth user experience even when API rate limits are reached.

## Features Implemented

### 1. Rate Limit Detection

The extension now detects HTTP 429 responses and parses rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until retry is allowed

### 2. Exponential Backoff Retry

All API calls automatically retry with exponential backoff on transient errors:
- **Initial delay**: 1 second
- **Max retries**: 3 attempts
- **Backoff schedule**: 1s → 2s → 4s
- **Excluded from retry**: Rate limit errors (429) and auth errors (401)

### 3. User Notifications

When rate limited by user actions (not background sync):
- Desktop notification shows rate limit details
- Message indicates when to try again
- Example: *"You've reached the API rate limit (100 requests). Try again in 15 minutes."*

### 4. Smart Sync Frequency

Background sync has been optimized to avoid hitting rate limits:
- **Check interval**: Every 60 seconds (checks if sync is needed)
- **Sync interval**: Every 10 minutes (default, user-configurable)
- **Selector cache**: 24 hours (seldom changes)
- **Rate limit aware**: Silently skips sync when rate limited

### 5. Graceful Degradation

- Background sync failures don't interrupt user experience
- Cached data used when API is unavailable
- Rate limit errors logged but don't break functionality
- User-initiated actions show clear error messages

## API Request Budget

### Free Tier Users (100 req/min)

**Background Sync** (every 10 min):
- Prompts sync: 1 request
- Theme sync: 1 request
- **Total**: 2 requests per 10 minutes = ~0.2 req/min

**Typical User Actions**:
- Insert prompt: 2 requests (get + increment usage)
- Save prompt: 1 request
- Improve prompt (AI): 1 request
- Token validation: 1 request

**Maximum hourly usage**:
- Background: ~12 requests/hour
- Leaves ~88 requests/hour for user actions

This allows for:
- ~44 prompt insertions per hour
- Or ~88 other actions per hour
- Well within the 100 req/min limit

## Error Handling

### Rate Limit Error (429)

**User-initiated actions**:
```typescript
try {
  await apiClient.getPrompts()
} catch (error) {
  if (error instanceof RateLimitError) {
    // Desktop notification shown
    // Error response includes:
    // - error.message
    // - error.retryAfter (seconds)
    // - error.limit
    // - error.remaining
    // - error.reset (timestamp)
  }
}
```

**Background sync**:
- Silently logged to console
- No user notification (not user-initiated)
- Will retry on next sync interval

### Network Errors

Automatically retried with exponential backoff (up to 3 times):
- Timeouts
- Connection failures
- 5xx server errors

### Authentication Errors (401)

Not retried (immediate failure):
- Invalid token
- Expired token
- User prompted to re-authenticate

## Code Changes

### Files Modified

1. **`extension/lib/api.ts`**
   - Added `RateLimitError` class
   - Implemented `retryWithBackoff()` method
   - Updated `trpcFetch()` to detect 429 responses
   - Updated `trpcMutate()` to detect 429 responses
   - Parse rate limit headers from responses

2. **`extension/background/index.ts`**
   - Import `RateLimitError` from api module
   - Added `showRateLimitNotification()` function
   - Updated message handler to catch rate limit errors
   - Updated `syncPrompts()` to handle rate limits silently
   - Updated `syncTheme()` to handle rate limits silently

3. **`extension/lib/storage.ts`**
   - Increased default `syncInterval` from 5 to 10 minutes
   - Added comment explaining rate limit consideration

4. **`extension/package.json.manifest`**
   - Added `notifications` permission

## Testing

### Manual Testing

1. **Test rate limit detection**:
   ```javascript
   // In browser console (extension context)
   chrome.runtime.sendMessage({
     type: 'GET_PROMPTS',
     payload: {}
   }, response => {
     console.log(response)
   })
   ```

2. **Trigger rate limit** (if Redis configured):
   - Make 100+ rapid API calls
   - Should see notification after limit reached
   - Check console for rate limit details

3. **Test background sync**:
   - Enable developer mode
   - Open extension service worker console
   - Watch sync logs every 60 seconds
   - Rate limit won't trigger notification (silent)

4. **Test exponential backoff**:
   - Disable network temporarily
   - Try inserting prompt
   - Should see 3 retry attempts with delays
   - Console logs: "Retry attempt 1/3 after 1000ms"

### Testing Without Redis

If Redis is not configured (rate limiting disabled):
- All API calls will succeed
- No 429 responses
- No rate limit notifications
- Extension works normally with infinite requests

## Configuration

### User-Configurable Settings

Users can adjust sync frequency in extension options:

**Path**: Extension Options → Settings → Sync Interval

- **Min**: 1 minute
- **Max**: 60 minutes
- **Default**: 10 minutes (recommended)
- **Disable**: Turn off auto-sync entirely

**Recommendation**: Keep at 10 minutes or higher to avoid rate limits with heavy usage.

### For Developers

To test rate limiting locally:

1. Start Redis:
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

2. Configure `.env`:
   ```env
   REDIS_URL="redis://localhost:6379"
   ```

3. Temporarily reduce limits in `src/lib/api-rate-limit.ts`:
   ```typescript
   export const RATE_LIMIT_TIERS = {
     FREE: {
       limit: 10,  // Reduced from 100 for testing
       window: 60,
     },
   }
   ```

4. Make rapid API calls from extension
5. Observe 429 responses and notifications

## Monitoring

### Console Logs

**Rate limit detected (background)**:
```
[Background] Rate limited during auto-sync. Will retry later.
[Background] Rate limit resets at 2025-10-28T13:45:00.000Z
```

**Exponential backoff**:
```
[API] Retry attempt 1/3 after 1000ms
[API] Retry attempt 2/3 after 2000ms
[API] Retry attempt 3/3 after 4000ms
```

**Rate limit notification**:
```
[Background] Rate limited: Too many requests. Reset at 2025-10-28T13:45:00.000Z
```

### Chrome DevTools

View extension logs:
1. Go to `chrome://extensions`
2. Enable Developer mode
3. Click "Inspect views: service worker"
4. Check Console tab for logs

### Network Tab

Check rate limit headers in responses:
1. Open DevTools Network tab
2. Filter by "trpc"
3. Look for 429 responses
4. Check Response Headers:
   - `X-RateLimit-Limit`
   - `X-RateLimit-Remaining`
   - `X-RateLimit-Reset`
   - `Retry-After`

## Best Practices

### For Users

1. **Don't disable auto-sync** unless necessary - it provides a better experience
2. **Increase sync interval** if hitting rate limits frequently (20-30 minutes)
3. **Use cached data** when possible (popup shows cached prompts by default)
4. **Avoid rapid-fire insertions** - wait a moment between prompt insertions

### For Developers

1. **Always test with rate limiting enabled** in development
2. **Log rate limit events** for monitoring and debugging
3. **Use exponential backoff** for all network requests (already implemented)
4. **Cache aggressively** to reduce API calls (already implemented)
5. **Respect `Retry-After` header** (already implemented)

## Troubleshooting

### Issue: Seeing frequent rate limit notifications

**Solutions**:
1. Increase sync interval in extension options (e.g., 20-30 minutes)
2. Reduce frequency of manual actions (prompt insertions, saves)
3. Contact admin to upgrade subscription tier (Pro: 500 req/min)
4. Check if multiple devices/extensions share same token (each counts separately)

### Issue: Extension not syncing

**Check**:
1. Is auto-sync enabled in settings?
2. Is token valid? (go to popup, check auth status)
3. Check console for rate limit messages
4. Check network connectivity
5. Try manual sync from popup (Sync button)

### Issue: Background sync silently fails

**Check**:
1. Open service worker console
2. Look for rate limit warnings
3. Check last sync timestamp in storage
4. If rate limited, wait for reset time
5. Sync will auto-resume after rate limit expires

## Future Enhancements

Potential improvements:

- [ ] Show rate limit status in extension badge
- [ ] Add rate limit progress bar in popup
- [ ] Implement request queue with priority
- [ ] Add offline mode with full local storage
- [ ] Smart throttling (reduce frequency when approaching limit)
- [ ] Per-endpoint rate limit tracking
- [ ] Visual indicator when rate limited (icon overlay)

## References

- [HTTP 429 Status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
- [RateLimit Headers Draft](https://datatracker.ietf.org/doc/html/draft-polli-ratelimit-headers)
- [Chrome Extension Notifications](https://developer.chrome.com/docs/extensions/reference/notifications/)
- [Main Rate Limiting Documentation](../docs/RATE_LIMITING.md)

---

**Last Updated**: October 2025
**Extension Version**: 1.0.0
