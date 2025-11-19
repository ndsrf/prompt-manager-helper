import { Page } from '@playwright/test';

/**
 * Helper functions for authentication in E2E tests
 */

export async function signUp(page: Page, email: string, password: string, name: string) {
  await page.goto('/auth/register', { waitUntil: 'domcontentloaded' });

  await page.waitForSelector('#name', { state: 'visible' });
  await page.fill('#name', name);
  await page.fill('#email', email);
  await page.fill('#password', password);

  await page.click('button[type="submit"]');

  // Wait for redirect after successful signup (goes to login page)
  await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

  await page.waitForSelector('#email', { state: 'visible' });
  await page.fill('#email', email);
  await page.fill('#password', password);

  await page.click('button[type="submit"]');

  // Wait for redirect after successful login
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

export async function signOut(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]');

  // Click sign out button
  await page.click('[data-testid="sign-out"]');

  // Wait for redirect to home/signin page
  await page.waitForURL('/', { timeout: 5000 });
}

/**
 * Generate a unique test user email
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Create an authenticated context for tests
 */
export async function createAuthenticatedPage(page: Page) {
  const email = generateTestEmail();
  const password = 'TestPassword123!';
  const name = 'Test User';

  await signUp(page, email, password, name);

  return { email, password, name };
}
