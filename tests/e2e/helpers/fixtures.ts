import { Page } from '@playwright/test';

/**
 * Helper functions to create test data
 */

export async function createTestPrompt(
  page: Page,
  data: {
    title: string;
    description?: string;
    content: string;
    folderId?: string;
    tags?: string[];
  }
) {
  // Navigate to create prompt page
  await page.goto('/library/new');

  // Fill in prompt details
  await page.fill('input[name="title"]', data.title);

  if (data.description) {
    await page.fill('textarea[name="description"]', data.description);
  }

  // Fill in content using CodeMirror editor
  const editor = page.locator('.cm-content');
  await editor.click();
  await editor.fill(data.content);

  // Select folder if provided
  if (data.folderId) {
    await page.selectOption('select[name="folderId"]', data.folderId);
  }

  // Add tags if provided
  if (data.tags && data.tags.length > 0) {
    for (const tag of data.tags) {
      await page.fill('input[name="tags"]', tag);
      await page.press('input[name="tags"]', 'Enter');
    }
  }

  // Save the prompt
  await page.click('button[type="submit"]');

  // Wait for redirect or success message
  await page.waitForSelector('[data-testid="prompt-saved"]', { timeout: 5000 });
}

export async function createTestFolder(
  page: Page,
  data: {
    name: string;
    description?: string;
    parentId?: string;
  }
) {
  // Click create folder button
  await page.click('[data-testid="create-folder"]');

  // Fill in folder details
  await page.fill('input[name="folderName"]', data.name);

  if (data.description) {
    await page.fill('textarea[name="folderDescription"]', data.description);
  }

  if (data.parentId) {
    await page.selectOption('select[name="parentFolder"]', data.parentId);
  }

  // Save the folder
  await page.click('button[data-testid="save-folder"]');

  // Wait for folder to appear in the list
  await page.waitForSelector(`[data-testid="folder-${data.name}"]`, { timeout: 5000 });
}

export async function createTestTag(
  page: Page,
  data: {
    name: string;
    color?: string;
  }
) {
  // Click create tag button
  await page.click('[data-testid="create-tag"]');

  // Fill in tag details
  await page.fill('input[name="tagName"]', data.name);

  if (data.color) {
    await page.fill('input[name="tagColor"]', data.color);
  }

  // Save the tag
  await page.click('button[data-testid="save-tag"]');

  // Wait for tag to appear
  await page.waitForSelector(`[data-testid="tag-${data.name}"]`, { timeout: 5000 });
}
