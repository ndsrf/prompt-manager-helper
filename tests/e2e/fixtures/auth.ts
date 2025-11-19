import { test as base, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
}

export interface AuthFixtures {
  authenticatedPage: any;
  testUser: TestUser;
}

/**
 * Extended test fixture with authentication helpers
 */
export const test = base.extend<AuthFixtures>({
  testUser: async ({}, use) => {
    // Create a test user
    const password = 'Test123!@#';
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
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

    await use({
      id: user.id,
      email: user.email,
      password,
      name: user.name || 'Test User',
    });

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  },

  authenticatedPage: async ({ page, testUser }: any, use: any) => {
    // Navigate to login page
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

    // Wait for form to be ready
    await page.waitForSelector('#email', { state: 'visible' });

    // Fill in login form
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });

    await use(page);
  },
});

export { expect };
