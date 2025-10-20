import { test, expect } from './fixtures/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Prompt Editor', () => {
  let testPrompt: any;

  test.beforeEach(async ({ testUser }) => {
    // Create a test prompt
    testPrompt = await prisma.prompt.create({
      data: {
        userId: testUser.id,
        title: 'Test Editor Prompt',
        content: 'Write a story about {{topic}} in {{length}} words.',
        description: 'A test prompt for editing',
        variables: [
          { name: 'topic', type: 'text', default: 'adventure' },
          { name: 'length', type: 'number', default: '500' },
        ],
        targetLlm: 'chatgpt',
        privacy: 'private',
      },
    });
  });

  test.afterEach(async () => {
    if (testPrompt) {
      await prisma.prompt.delete({ where: { id: testPrompt.id } }).catch(() => {});
    }
  });

  test.describe('Editor Interface', () => {
    test('should load prompt in editor', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      // Check if title is loaded
      const titleInput = authenticatedPage.locator('input[name="title"]');
      await expect(titleInput).toHaveValue('Test Editor Prompt');

      // Check if description is loaded
      const descriptionInput = authenticatedPage.locator('textarea[name="description"]');
      await expect(descriptionInput).toHaveValue('A test prompt for editing');
    });

    test('should update prompt title', async ({ authenticatedPage, testUser }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      const titleInput = authenticatedPage.locator('input[name="title"]');
      await titleInput.fill('Updated Test Prompt');

      // Save changes
      const saveButton = authenticatedPage.locator('button:has-text("Save")');
      await saveButton.click();

      // Wait for save to complete
      await authenticatedPage.waitForTimeout(1000);

      // Verify in database
      const updated = await prisma.prompt.findUnique({
        where: { id: testPrompt.id },
      });

      expect(updated?.title).toBe('Updated Test Prompt');
    });

    test('should update prompt content', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      // Find content editor (CodeMirror)
      const contentEditor = authenticatedPage.locator(
        '.cm-content, [role="textbox"], textarea[name="content"]'
      ).first();

      await contentEditor.click();
      await contentEditor.fill('New content: {{variable}}');

      // Save changes
      const saveButton = authenticatedPage.locator('button:has-text("Save")');
      await saveButton.click();

      await authenticatedPage.waitForTimeout(1000);

      // Verify in database
      const updated = await prisma.prompt.findUnique({
        where: { id: testPrompt.id },
      });

      expect(updated?.content).toContain('New content');
    });

    test('should show character and token count', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      // Should show token counter
      await expect(authenticatedPage.locator('text=/chars/i')).toBeVisible();
      await expect(authenticatedPage.locator('text=/words/i')).toBeVisible();
      await expect(authenticatedPage.locator('text=/tokens/i')).toBeVisible();
    });

    test('should auto-save prompt', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      const titleInput = authenticatedPage.locator('input[name="title"]');
      await titleInput.fill('Auto-saved Title');

      // Wait for auto-save (30 seconds in real app, but we can trigger save)
      await authenticatedPage.waitForTimeout(2000);

      // Check for auto-save indicator
      const autoSaveIndicator = authenticatedPage.locator('text=/saved|saving/i');
      await expect(autoSaveIndicator).toBeVisible({ timeout: 35000 });
    });
  });

  test.describe('Variables', () => {
    test('should display existing variables', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      // Should show variables panel
      await expect(authenticatedPage.locator('text=/topic/i')).toBeVisible();
      await expect(authenticatedPage.locator('text=/length/i')).toBeVisible();
    });

    test('should add a new variable', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      // Click add variable button
      const addVariableButton = authenticatedPage.locator('button:has-text("Add Variable")');
      await addVariableButton.click();

      // Fill in variable details
      await authenticatedPage.fill('input[name="variableName"]', 'style');
      await authenticatedPage.selectOption('select[name="variableType"]', 'text');
      await authenticatedPage.fill('input[name="variableDefault"]', 'formal');

      // Save variable
      const saveVariableButton = authenticatedPage.locator('button:has-text("Save Variable")');
      await saveVariableButton.click();

      // Should show new variable
      await expect(authenticatedPage.locator('text=/style/i')).toBeVisible();
    });

    test('should highlight variables in content', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      // Variables should be highlighted (check for specific class or style)
      const variableHighlight = authenticatedPage.locator('text=/{{topic}}/');
      await expect(variableHighlight).toBeVisible();
    });
  });

  test.describe('Version History', () => {
    test('should create version on content change', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      // Make a change
      const contentEditor = authenticatedPage.locator('.cm-content, textarea[name="content"]').first();
      await contentEditor.click();
      await contentEditor.fill('Version 2 content');

      // Save
      const saveButton = authenticatedPage.locator('button:has-text("Save")');
      await saveButton.click();

      await authenticatedPage.waitForTimeout(1000);

      // Check version history
      const historyButton = authenticatedPage.locator('button:has-text("History"), a[href*="history"]');
      await historyButton.click();

      // Should show versions
      await expect(authenticatedPage.locator('text=/version/i')).toBeVisible();
    });

    test('should view previous version', async ({ authenticatedPage, testUser }) => {
      // Create a version
      await prisma.promptVersion.create({
        data: {
          promptId: testPrompt.id,
          versionNumber: 1,
          title: testPrompt.title,
          content: 'Original content',
          variables: testPrompt.variables,
          changesSummary: 'Initial version',
          isSnapshot: true,
          createdBy: testUser.id,
        },
      });

      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      // Open history
      const historyButton = authenticatedPage.locator('button:has-text("History")');
      await historyButton.click();

      // Should show version
      await expect(authenticatedPage.locator('text=/version 1/i')).toBeVisible();
    });

    test('should restore previous version', async ({ authenticatedPage, testUser }) => {
      // Create a version
      await prisma.promptVersion.create({
        data: {
          promptId: testPrompt.id,
          versionNumber: 1,
          title: testPrompt.title,
          content: 'Original content to restore',
          variables: testPrompt.variables,
          changesSummary: 'Initial version',
          isSnapshot: true,
          createdBy: testUser.id,
        },
      });

      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      // Open history
      const historyButton = authenticatedPage.locator('button:has-text("History")');
      await historyButton.click();

      // Click restore on version
      const restoreButton = authenticatedPage.locator('button:has-text("Restore")').first();
      await restoreButton.click();

      // Confirm restore
      authenticatedPage.on('dialog', (dialog) => dialog.accept());

      await authenticatedPage.waitForTimeout(1000);

      // Check content was restored
      const updated = await prisma.prompt.findUnique({
        where: { id: testPrompt.id },
      });

      expect(updated?.content).toContain('Original content to restore');
    });
  });

  test.describe('Testing Interface', () => {
    test('should open test interface', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      // Click test button
      const testButton = authenticatedPage.locator('button:has-text("Test")');
      await testButton.click();

      // Should show test interface
      await expect(authenticatedPage.locator('text=/test.*prompt/i')).toBeVisible();
    });

    test('should fill in variables before testing', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      const testButton = authenticatedPage.locator('button:has-text("Test")');
      await testButton.click();

      // Should show variable inputs
      await expect(authenticatedPage.locator('input[name="topic"]')).toBeVisible();
      await expect(authenticatedPage.locator('input[name="length"]')).toBeVisible();

      // Fill in variables
      await authenticatedPage.fill('input[name="topic"]', 'space exploration');
      await authenticatedPage.fill('input[name="length"]', '1000');

      // Submit test
      const runTestButton = authenticatedPage.locator('button:has-text("Run Test")');
      await expect(runTestButton).toBeVisible();
    });

    test('should show LLM selection', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      const testButton = authenticatedPage.locator('button:has-text("Test")');
      await testButton.click();

      // Should show LLM selector
      const llmSelector = authenticatedPage.locator('select[name="llm"], [role="combobox"]');
      await expect(llmSelector).toBeVisible();
    });
  });

  test.describe('AI Improvement', () => {
    test('should show improve button', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      const improveButton = authenticatedPage.locator('button:has-text("Improve")');
      await expect(improveButton).toBeVisible();
    });

    test('should analyze prompt when improve is clicked', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      const improveButton = authenticatedPage.locator('button:has-text("Improve")');
      await improveButton.click();

      // Should show loading state
      await expect(authenticatedPage.locator('text=/analyzing|improving/i')).toBeVisible({
        timeout: 2000,
      });
    });
  });

  test.describe('Markdown Preview', () => {
    test('should toggle markdown preview', async ({ authenticatedPage }) => {
      await authenticatedPage.goto(`/editor/${testPrompt.id}`);

      // Look for preview toggle button
      const previewButton = authenticatedPage.locator('button:has-text("Preview")');
      await previewButton.click();

      // Should show preview panel
      await expect(authenticatedPage.locator('[class*="preview"]')).toBeVisible();
    });
  });
});
