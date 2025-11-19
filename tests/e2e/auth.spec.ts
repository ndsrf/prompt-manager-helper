import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

test.describe('Authentication', () => {
  test.describe('Login', () => {
    let testUser: any;

    test.beforeAll(async () => {
      // Create test user once for all login tests
      const password = 'Test123!@#';
      const passwordHash = await bcrypt.hash(password, 12);

      testUser = await prisma.user.create({
        data: {
          email: `test-login-${Date.now()}@example.com`,
          name: 'Test User',
          passwordHash,
          emailVerified: true,
          provider: 'email',
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
        },
      });
    });

    test.afterAll(async () => {
      if (testUser) {
        await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
      }
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      
      await page.waitForSelector('#email', { state: 'visible', timeout: 10000 });
      await page.fill('#email', testUser.email);
      await page.fill('#password', 'Test123!@#');
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 15000 });
      await expect(page).toHaveURL('/dashboard');
    });

    test('should redirect to login when accessing protected page without auth', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      
      // Should redirect to login
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    });
  });
});
