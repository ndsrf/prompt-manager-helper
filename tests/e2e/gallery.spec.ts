import { test as baseTest, expect } from '@playwright/test';
import { test as authTest } from './fixtures/auth';
import { PrismaClient } from '@prisma/client';
import { setupTest, cleanupTest } from './helpers/fixtures';

const prisma = new PrismaClient();

baseTest.describe('Public Gallery', () => {
  baseTest.describe('Unauthenticated Access', () => {
    baseTest('should allow unauthenticated users to access gallery page', async ({ page }) => {
      // Navigate to gallery without logging in
      await page.goto('/gallery');

      // Should be able to access the page
      await expect(page).toHaveURL(/\/gallery/);
      
      // Should see the gallery header
      await expect(page.getByRole('heading', { name: /Public Gallery/i })).toBeVisible();
      
      // Should see login button for unauthenticated users
      await expect(page.getByRole('button', { name: /Login/i })).toBeVisible();
    });

    baseTest('should show only public prompts to unauthenticated users', async ({ page }) => {
      const { user, cleanup } = await setupTest();

      try {
        // Create a public prompt (visible to everyone)
        await prisma.prompt.create({
          data: {
            userId: user.id,
            title: 'Truly Public Prompt',
            content: 'This is visible to everyone',
            privacy: 'public',
            targetLlm: 'chatgpt',
          },
        });

        // Create a registered-only prompt (visible to registered users only)
        await prisma.prompt.create({
          data: {
            userId: user.id,
            title: 'Registered Only Prompt',
            content: 'This is visible to registered users',
            privacy: 'registered',
            targetLlm: 'chatgpt',
          },
        });

        // Navigate to gallery as unauthenticated user
        await page.goto('/gallery');

        // Should see the public prompt
        await expect(page.getByText('Truly Public Prompt')).toBeVisible();

        // Should NOT see the registered-only prompt
        await expect(page.getByText('Registered Only Prompt')).not.toBeVisible();
      } finally {
        await cleanup();
      }
    });

    baseTest.skip('should allow unauthenticated users to copy prompts', async ({ page }) => {
      const { user, cleanup } = await setupTest();

      try {
        // Create a public prompt
        await prisma.prompt.create({
          data: {
            userId: user.id,
            title: 'Copyable Prompt',
            content: 'Test content to copy',
            privacy: 'public',
            targetLlm: 'chatgpt',
          },
        });

        await page.goto('/gallery');

        // Find the prompt card and hover to reveal actions
        const promptCard = page.getByText('Copyable Prompt').locator('..');
        await promptCard.hover();

        // Click the copy button
        const copyButton = promptCard.getByRole('button', { name: /copy/i });
        await copyButton.click();

        // Should see success toast
        await expect(page.getByText(/Copied to clipboard/i)).toBeVisible();
      } finally {
        await cleanup();
      }
    });

    baseTest.skip('should redirect unauthenticated users to login when viewing prompt details', async ({ page }) => {
      const { user, cleanup } = await setupTest();

      try {
        // Create a public prompt
        await prisma.prompt.create({
          data: {
            userId: user.id,
            title: 'Detail View Prompt',
            content: 'Test content',
            privacy: 'public',
            targetLlm: 'chatgpt',
          },
        });

        await page.goto('/gallery');

        // Find the prompt card and hover to reveal actions
        const promptCard = page.getByText('Detail View Prompt').locator('..');
        await promptCard.hover();

        // Click the View button
        const viewButton = promptCard.getByRole('button', { name: /View/i });
        await viewButton.click();

        // Should see login required toast
        await expect(page.getByText(/Login required/i)).toBeVisible();

        // Should redirect to login page
        await expect(page).toHaveURL(/\/auth\/login/);
      } finally {
        await cleanup();
      }
    });
  });

  authTest.describe('Authenticated Access', () => {
    authTest.skip('should show both public and registered prompts to authenticated users', async ({ authenticatedPage, testUser }) => {
      const { user, cleanup } = await setupTest();

      try {
        // Create a public prompt
        await prisma.prompt.create({
          data: {
            userId: user.id,
            title: 'Public Prompt',
            content: 'Visible to everyone',
            privacy: 'public',
            targetLlm: 'chatgpt',
          },
        });

        // Create a registered-only prompt
        await prisma.prompt.create({
          data: {
            userId: user.id,
            title: 'Registered Prompt',
            content: 'Visible to registered users',
            privacy: 'registered',
            targetLlm: 'chatgpt',
          },
        });

        await authenticatedPage.goto('/gallery');

        // Should see both prompts
        await expect(authenticatedPage.getByText('Public Prompt')).toBeVisible();
        await expect(authenticatedPage.getByText('Registered Prompt')).toBeVisible();
      } finally {
        await cleanup();
      }
    });

    authTest.skip('should allow authenticated users to view prompt details', async ({ authenticatedPage, testUser }) => {
      const { user, cleanup } = await setupTest();

      try {
        // Create a public prompt
        await prisma.prompt.create({
          data: {
            userId: user.id,
            title: 'Viewable Prompt',
            content: 'Test content',
            privacy: 'public',
            targetLlm: 'chatgpt',
          },
        });

        await authenticatedPage.goto('/gallery');

        // Find the prompt card and click View
        const promptCard = authenticatedPage.getByText('Viewable Prompt').locator('..');
        await promptCard.hover();
        
        const viewButton = promptCard.getByRole('button', { name: /View/i });
        await viewButton.click();

        // Should navigate to editor page
        await expect(authenticatedPage).toHaveURL(/\/editor\//);
      } finally {
        await cleanup();
      }
    });

    authTest('should show dashboard button for authenticated users', async ({ authenticatedPage, testUser }) => {
      const { user, cleanup } = await setupTest();

      try {
        await authenticatedPage.goto('/gallery');

        // Should see dashboard button (Home icon)
        await expect(authenticatedPage.getByTitle('Back to Dashboard')).toBeVisible();
        
        // Should NOT see login button
        await expect(authenticatedPage.getByRole('button', { name: /^Login$/i })).not.toBeVisible();
      } finally {
        await cleanup();
      }
    });
  });

  authTest.describe('Privacy Level Changes', () => {
    authTest.skip('should support all four privacy levels', async ({ authenticatedPage, testUser }) => {
      const { user, cleanup } = await setupTest();

      try {
        // Create a prompt
        const prompt = await prisma.prompt.create({
          data: {
            userId: user.id,
            title: 'Privacy Test Prompt',
            content: 'Test content',
            privacy: 'private',
            targetLlm: 'chatgpt',
          },
        });

        // Navigate to the prompt editor
        await authenticatedPage.goto(`/editor/${prompt.id}`);

        // Open the metadata panel
        await authenticatedPage.getByRole('button', { name: /metadata/i }).click();

        // Check that all privacy levels are available
        const privacySelect = authenticatedPage.locator('[name="privacy"]').or(authenticatedPage.getByLabel(/privacy/i));
        await privacySelect.click();

        // Should see all four options
        await expect(authenticatedPage.getByRole('option', { name: /^Private$/i })).toBeVisible();
        await expect(authenticatedPage.getByRole('option', { name: /Shared/i })).toBeVisible();
        await expect(authenticatedPage.getByRole('option', { name: /Registered Users/i })).toBeVisible();
        await expect(authenticatedPage.getByRole('option', { name: /^Public$/i })).toBeVisible();
      } finally {
        await cleanup();
      }
    });
  });
});
