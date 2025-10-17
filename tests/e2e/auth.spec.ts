import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

test.describe('Authentication', () => {
  test.describe('Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      await page.goto('/auth/register');

      const timestamp = Date.now();
      const email = `newuser-${timestamp}@example.com`;

      // Fill registration form
      await page.fill('input[name="name"]', 'New User');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.fill('input[name="confirmPassword"]', 'Test123!@#');

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect or show success message
      await expect(page).toHaveURL(/\/(dashboard|auth\/verify-email)/);

      // Cleanup
      await prisma.user.deleteMany({ where: { email } }).catch(() => {});
    });

    test('should show validation errors for invalid inputs', async ({ page }) => {
      await page.goto('/auth/register');

      // Submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('text=/required/i')).toBeVisible();
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.goto('/auth/register');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=/password.*match/i')).toBeVisible();
    });

    test('should show error for weak password', async ({ page }) => {
      await page.goto('/auth/register');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'weak');
      await page.fill('input[name="confirmPassword"]', 'weak');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=/password.*strong/i')).toBeVisible();
    });

    test('should show error for duplicate email', async ({ page }) => {
      // Create existing user
      const existingEmail = `existing-${Date.now()}@example.com`;
      const passwordHash = await bcrypt.hash('Test123!@#', 12);

      await prisma.user.create({
        data: {
          email: existingEmail,
          name: 'Existing User',
          passwordHash,
          emailVerified: true,
          provider: 'email',
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
        },
      });

      await page.goto('/auth/register');

      await page.fill('input[name="name"]', 'New User');
      await page.fill('input[name="email"]', existingEmail);
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.fill('input[name="confirmPassword"]', 'Test123!@#');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=/already exists|already registered/i')).toBeVisible();

      // Cleanup
      await prisma.user.deleteMany({ where: { email: existingEmail } }).catch(() => {});
    });
  });

  test.describe('Login', () => {
    let testUser: any;

    test.beforeEach(async () => {
      // Create test user
      const password = 'Test123!@#';
      const passwordHash = await bcrypt.hash(password, 12);

      testUser = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          name: 'Test User',
          passwordHash,
          emailVerified: true,
          provider: 'email',
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
        },
      });
    });

    test.afterEach(async () => {
      if (testUser) {
        await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
      }
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', 'Test123!@#');

      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 });
      await expect(page).toHaveURL('/dashboard');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', 'WrongPassword123!');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=/invalid.*credentials|incorrect.*password/i')).toBeVisible();
    });

    test('should show error for non-existent user', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.fill('input[name="password"]', 'Test123!@#');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=/invalid.*credentials|user.*not.*found/i')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/auth/login');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=/required/i')).toBeVisible();
    });

    test('should have link to registration page', async ({ page }) => {
      await page.goto('/auth/login');

      const registerLink = page.locator('a[href*="/auth/register"]');
      await expect(registerLink).toBeVisible();
    });

    test('should have link to forgot password', async ({ page }) => {
      await page.goto('/auth/login');

      const forgotLink = page.locator('a[href*="/auth/forgot-password"]');
      await expect(forgotLink).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    let testUser: any;

    test.beforeEach(async () => {
      const password = 'Test123!@#';
      const passwordHash = await bcrypt.hash(password, 12);

      testUser = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          name: 'Test User',
          passwordHash,
          emailVerified: true,
          provider: 'email',
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
        },
      });
    });

    test.afterEach(async () => {
      if (testUser) {
        await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
      }
    });

    test('should persist session after page reload', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.click('button[type="submit"]');

      await page.waitForURL('/dashboard');

      // Reload page
      await page.reload();

      // Should still be on dashboard (not redirected to login)
      await expect(page).toHaveURL('/dashboard');
    });

    test('should logout successfully', async ({ page }) => {
      await page.goto('/auth/login');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', 'Test123!@#');
      await page.click('button[type="submit"]');

      await page.waitForURL('/dashboard');

      // Click logout button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")');
      await logoutButton.click();

      // Should redirect to login or home
      await page.waitForURL(/\/(auth\/login|$)/, { timeout: 5000 });
    });

    test('should redirect to login when accessing protected page without auth', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login
      await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
    });
  });
});
