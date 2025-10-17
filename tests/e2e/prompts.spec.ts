import { test, expect } from './fixtures/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Prompt Management', () => {
  test.describe('Prompt Library', () => {
    test('should display empty state when no prompts exist', async ({
      authenticatedPage,
      testUser,
    }) => {
      await authenticatedPage.goto('/library');

      await expect(authenticatedPage.locator('text=/no prompts found/i')).toBeVisible();
    });

    test('should create a new prompt', async ({ authenticatedPage, testUser }) => {
      await authenticatedPage.goto('/library');

      // Click new prompt button
      await authenticatedPage.click('button:has-text("New Prompt"), a[href*="/library/new"]');

      // Fill in prompt details
      await authenticatedPage.fill('input[name="title"]', 'Test Prompt');
      await authenticatedPage.fill(
        'textarea[name="description"]',
        'This is a test prompt description'
      );

      // Fill in content (might be in CodeMirror editor)
      const contentArea = authenticatedPage.locator(
        'textarea[name="content"], .cm-content, [role="textbox"]'
      ).first();
      await contentArea.fill('Write a story about {{topic}}');

      // Save prompt
      await authenticatedPage.click('button:has-text("Save"), button:has-text("Create")');

      // Should redirect to library or prompt view
      await authenticatedPage.waitForURL(/\/library/, { timeout: 10000 });

      // Verify prompt appears in list
      await expect(authenticatedPage.locator('text="Test Prompt"')).toBeVisible();

      // Cleanup
      await prisma.prompt.deleteMany({
        where: { userId: testUser.id, title: 'Test Prompt' },
      });
    });

    test('should display list of prompts', async ({ authenticatedPage, testUser }) => {
      // Create test prompts
      const prompts = await Promise.all([
        prisma.prompt.create({
          data: {
            userId: testUser.id,
            title: 'Prompt 1',
            content: 'Content 1',
            description: 'Description 1',
            privacy: 'private',
          },
        }),
        prisma.prompt.create({
          data: {
            userId: testUser.id,
            title: 'Prompt 2',
            content: 'Content 2',
            description: 'Description 2',
            privacy: 'private',
          },
        }),
      ]);

      await authenticatedPage.goto('/library');

      // Should display both prompts
      await expect(authenticatedPage.locator('text="Prompt 1"')).toBeVisible();
      await expect(authenticatedPage.locator('text="Prompt 2"')).toBeVisible();

      // Cleanup
      await prisma.prompt.deleteMany({
        where: { id: { in: prompts.map((p) => p.id) } },
      });
    });

    test('should search prompts', async ({ authenticatedPage, testUser }) => {
      // Create test prompts
      const prompts = await Promise.all([
        prisma.prompt.create({
          data: {
            userId: testUser.id,
            title: 'JavaScript Tutorial',
            content: 'Learn JavaScript',
            privacy: 'private',
          },
        }),
        prisma.prompt.create({
          data: {
            userId: testUser.id,
            title: 'Python Guide',
            content: 'Learn Python',
            privacy: 'private',
          },
        }),
      ]);

      await authenticatedPage.goto('/library');

      // Search for "JavaScript"
      const searchInput = authenticatedPage.locator('input[placeholder*="Search"], input[type="search"]');
      await searchInput.fill('JavaScript');

      // Should show JavaScript prompt
      await expect(authenticatedPage.locator('text="JavaScript Tutorial"')).toBeVisible();

      // Should not show Python prompt
      await expect(authenticatedPage.locator('text="Python Guide"')).not.toBeVisible();

      // Cleanup
      await prisma.prompt.deleteMany({
        where: { id: { in: prompts.map((p) => p.id) } },
      });
    });

    test('should toggle favorite status', async ({ authenticatedPage, testUser }) => {
      // Create test prompt
      const prompt = await prisma.prompt.create({
        data: {
          userId: testUser.id,
          title: 'Test Favorite Prompt',
          content: 'Content',
          isFavorite: false,
          privacy: 'private',
        },
      });

      await authenticatedPage.goto('/library');

      // Find the star/favorite button
      const promptCard = authenticatedPage.locator(`text="${prompt.title}"`).locator('..');
      const favoriteButton = promptCard.locator('button:has([class*="star" i])').first();

      await favoriteButton.click();

      // Wait for mutation to complete
      await authenticatedPage.waitForTimeout(1000);

      // Verify in database
      const updatedPrompt = await prisma.prompt.findUnique({
        where: { id: prompt.id },
      });

      expect(updatedPrompt?.isFavorite).toBe(true);

      // Cleanup
      await prisma.prompt.delete({ where: { id: prompt.id } });
    });

    test('should delete a prompt', async ({ authenticatedPage, testUser }) => {
      // Create test prompt
      const prompt = await prisma.prompt.create({
        data: {
          userId: testUser.id,
          title: 'Prompt to Delete',
          content: 'Content',
          privacy: 'private',
        },
      });

      await authenticatedPage.goto('/library');

      // Find the prompt card and open menu
      const promptCard = authenticatedPage.locator(`text="${prompt.title}"`).locator('..');
      const menuButton = promptCard.locator('button:has([class*="vertical" i])').first();

      await menuButton.click();

      // Click delete option
      const deleteButton = authenticatedPage.locator('text=/delete/i').last();
      await deleteButton.click();

      // Confirm deletion (if there's a confirmation dialog)
      authenticatedPage.on('dialog', (dialog) => dialog.accept());

      // Wait for prompt to be removed
      await authenticatedPage.waitForTimeout(1000);

      // Verify prompt is soft deleted
      const deletedPrompt = await prisma.prompt.findUnique({
        where: { id: prompt.id },
      });

      expect(deletedPrompt?.isDeleted).toBe(true);

      // Cleanup
      await prisma.prompt.delete({ where: { id: prompt.id } });
    });
  });

  test.describe('Folders', () => {
    test('should create a folder', async ({ authenticatedPage, testUser }) => {
      await authenticatedPage.goto('/library');

      // Click create folder button
      const createFolderButton = authenticatedPage.locator('button:has-text("New Folder"), button:has-text("Create Folder")');
      await createFolderButton.click();

      // Fill in folder name
      await authenticatedPage.fill('input[name="name"]', 'My Test Folder');
      await authenticatedPage.fill('textarea[name="description"]', 'Folder description');

      // Save folder
      await authenticatedPage.click('button:has-text("Create"), button:has-text("Save")');

      // Wait for folder to appear
      await authenticatedPage.waitForTimeout(1000);

      // Verify folder exists
      await expect(authenticatedPage.locator('text="My Test Folder"')).toBeVisible();

      // Cleanup
      await prisma.folder.deleteMany({
        where: { userId: testUser.id, name: 'My Test Folder' },
      });
    });

    test('should filter prompts by folder', async ({ authenticatedPage, testUser }) => {
      // Create folder
      const folder = await prisma.folder.create({
        data: {
          userId: testUser.id,
          name: 'Test Folder',
          path: '',
          level: 0,
        },
      });

      // Create prompts
      const [promptInFolder, promptOutsideFolder] = await Promise.all([
        prisma.prompt.create({
          data: {
            userId: testUser.id,
            title: 'Prompt in Folder',
            content: 'Content',
            folderId: folder.id,
            privacy: 'private',
          },
        }),
        prisma.prompt.create({
          data: {
            userId: testUser.id,
            title: 'Prompt Outside',
            content: 'Content',
            privacy: 'private',
          },
        }),
      ]);

      await authenticatedPage.goto('/library');

      // Click on folder
      await authenticatedPage.click(`text="${folder.name}"`);

      // Should show prompt in folder
      await expect(authenticatedPage.locator('text="Prompt in Folder"')).toBeVisible();

      // Should not show prompt outside folder
      await expect(authenticatedPage.locator('text="Prompt Outside"')).not.toBeVisible();

      // Cleanup
      await prisma.prompt.deleteMany({
        where: { id: { in: [promptInFolder.id, promptOutsideFolder.id] } },
      });
      await prisma.folder.delete({ where: { id: folder.id } });
    });
  });

  test.describe('Tags', () => {
    test('should create a tag', async ({ authenticatedPage, testUser }) => {
      await authenticatedPage.goto('/library');

      // Click create tag button
      const createTagButton = authenticatedPage.locator('button:has-text("New Tag"), button:has-text("Create Tag")');
      await createTagButton.click();

      // Fill in tag details
      await authenticatedPage.fill('input[name="name"]', 'test-tag');
      await authenticatedPage.fill('input[name="color"]', '#FF5733');

      // Save tag
      await authenticatedPage.click('button:has-text("Create"), button:has-text("Save")');

      // Wait for tag to appear
      await authenticatedPage.waitForTimeout(1000);

      // Cleanup
      await prisma.tag.deleteMany({
        where: { userId: testUser.id, name: 'test-tag' },
      });
    });

    test('should filter prompts by tag', async ({ authenticatedPage, testUser }) => {
      // Create tag
      const tag = await prisma.tag.create({
        data: {
          userId: testUser.id,
          name: 'coding',
          color: '#FF0000',
        },
      });

      // Create prompts
      const [promptWithTag, promptWithoutTag] = await Promise.all([
        prisma.prompt.create({
          data: {
            userId: testUser.id,
            title: 'Coding Prompt',
            content: 'Content',
            privacy: 'private',
            tags: {
              create: {
                tagId: tag.id,
              },
            },
          },
        }),
        prisma.prompt.create({
          data: {
            userId: testUser.id,
            title: 'Other Prompt',
            content: 'Content',
            privacy: 'private',
          },
        }),
      ]);

      await authenticatedPage.goto('/library');

      // Click on tag filter
      await authenticatedPage.click(`text="${tag.name}"`);

      // Should show prompt with tag
      await expect(authenticatedPage.locator('text="Coding Prompt"')).toBeVisible();

      // Should not show prompt without tag
      await expect(authenticatedPage.locator('text="Other Prompt"')).not.toBeVisible();

      // Cleanup
      await prisma.prompt.deleteMany({
        where: { id: { in: [promptWithTag.id, promptWithoutTag.id] } },
      });
      await prisma.tag.delete({ where: { id: tag.id } });
    });
  });
});
