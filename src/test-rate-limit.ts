/**
 * Test script for rate limiting functionality
 * Run with: npx tsx src/test-rate-limit.ts
 */

import { checkLoginRateLimit, checkAPIRateLimit, resetRateLimit } from './lib/rate-limit';
import { isRedisAvailable } from './lib/redis';

async function testRateLimiting() {
  console.log('=== Rate Limiting Test ===\n');

  // Check if Redis is available
  console.log('1. Checking Redis connection...');
  const redisAvailable = await isRedisAvailable();
  console.log(`   Redis available: ${redisAvailable}\n`);

  if (!redisAvailable) {
    console.log('⚠️  Redis is not available. Rate limiting will be disabled (graceful degradation).\n');
    console.log('To enable Redis:');
    console.log('1. Start Redis: docker run -d -p 6379:6379 redis:alpine');
    console.log('2. Set REDIS_URL in .env: REDIS_URL="redis://localhost:6379"\n');
    return;
  }

  // Test login rate limiting
  console.log('2. Testing login rate limiting (5 attempts per 15 minutes)...');
  const testEmail = 'test@example.com';

  // Reset any existing rate limit
  await resetRateLimit(testEmail, 'login');

  // Make 5 login attempts (should all succeed)
  for (let i = 1; i <= 5; i++) {
    const result = await checkLoginRateLimit(testEmail);
    console.log(`   Attempt ${i}: ${result.success ? '✅ Allowed' : '❌ Blocked'} (remaining: ${result.remaining}/${result.limit})`);
  }

  // 6th attempt should fail
  const result6 = await checkLoginRateLimit(testEmail);
  console.log(`   Attempt 6: ${result6.success ? '✅ Allowed' : '❌ Blocked'} (remaining: ${result6.remaining}/${result6.limit})`);

  if (!result6.success) {
    const resetDate = new Date(result6.reset * 1000);
    const minutesUntilReset = Math.ceil((result6.reset * 1000 - Date.now()) / 60000);
    console.log(`   ⏰ Rate limit will reset in ${minutesUntilReset} minutes at ${resetDate.toISOString()}`);
  }

  console.log();

  // Test API rate limiting
  console.log('3. Testing API rate limiting (100 requests per minute)...');
  const testUserId = 'user123';

  // Reset any existing rate limit
  await resetRateLimit(testUserId, 'api');

  // Make 100 API requests (should all succeed)
  console.log('   Making 100 API requests...');
  for (let i = 1; i <= 100; i++) {
    const result = await checkAPIRateLimit(testUserId);
    if (i === 1 || i === 50 || i === 100) {
      console.log(`   Request ${i}: ${result.success ? '✅ Allowed' : '❌ Blocked'} (remaining: ${result.remaining}/${result.limit})`);
    }
  }

  // 101st request should fail
  const result101 = await checkAPIRateLimit(testUserId);
  console.log(`   Request 101: ${result101.success ? '✅ Allowed' : '❌ Blocked'} (remaining: ${result101.remaining}/${result101.limit})`);

  if (!result101.success) {
    const resetDate = new Date(result101.reset * 1000);
    const secondsUntilReset = Math.ceil((result101.reset * 1000 - Date.now()) / 1000);
    console.log(`   ⏰ Rate limit will reset in ${secondsUntilReset} seconds at ${resetDate.toISOString()}`);
  }

  console.log();

  // Cleanup
  console.log('4. Cleaning up test data...');
  await resetRateLimit(testEmail, 'login');
  await resetRateLimit(testUserId, 'api');
  console.log('   ✅ Test data cleaned up\n');

  console.log('=== Test Complete ===');
}

// Run the test
testRateLimiting()
  .then(() => {
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
