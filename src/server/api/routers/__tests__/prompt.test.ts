import { promptRouter } from '../prompt';
import {
  createMockContext,
  prismaMock,
  createTestPrompt,
  createTestFolder,
  createTestTag,
  createTestPromptVersion,
} from '../../test-utils';
import { TRPCError } from '@trpc/server';

describe('promptRouter', () => {
  describe('getAll', () => {
    it('should return all prompts for the current user', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const mockPrompts = [
        createTestPrompt({ id: '1', title: 'Prompt 1' }),
        createTestPrompt({ id: '2', title: 'Prompt 2' }),
      ];

      prismaMock.prompt.findMany.mockResolvedValue(mockPrompts as any);

      const result = await caller.getAll({});

      expect(result.prompts).toHaveLength(2);
      expect(result.prompts[0].title).toBe('Prompt 1');
      expect(prismaMock.prompt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: '550e8400-e29b-41d4-a716-446655440000',
            isDeleted: false,
          }),
        })
      );
    });

    it('should filter prompts by folder', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const folderId = '550e8400-e29b-41d4-a716-446655440001';
      prismaMock.prompt.findMany.mockResolvedValue([]);

      await caller.getAll({ folderId });

      expect(prismaMock.prompt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            folderId,
          }),
        })
      );
    });

    it('should filter prompts by tags', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const tagIds = ['550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440021'];
      prismaMock.prompt.findMany.mockResolvedValue([]);

      await caller.getAll({ tagIds });

      expect(prismaMock.prompt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: {
              some: {
                tagId: {
                  in: tagIds,
                },
              },
            },
          }),
        })
      );
    });

    it('should filter prompts by search query', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const search = 'test search';
      prismaMock.prompt.findMany.mockResolvedValue([]);

      await caller.getAll({ search });

      expect(prismaMock.prompt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { content: { contains: search, mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should filter favorites only', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      prismaMock.prompt.findMany.mockResolvedValue([]);

      await caller.getAll({ favorites: true });

      expect(prismaMock.prompt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isFavorite: true,
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return a prompt by ID', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const mockPrompt = createTestPrompt();
      prismaMock.prompt.findFirst.mockResolvedValue(mockPrompt as any);

      const result = await caller.getById({ id: '550e8400-e29b-41d4-a716-446655440003' });

      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440003');
      expect(prismaMock.prompt.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: '550e8400-e29b-41d4-a716-446655440003',
            isDeleted: false,
          }),
        })
      );
    });

    it('should throw NOT_FOUND if prompt does not exist', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      prismaMock.prompt.findFirst.mockResolvedValue(null);

      await expect(
        caller.getById({ id: '550e8400-e29b-41d4-a716-446655440099' })
      ).rejects.toThrow('Prompt not found');
    });

    it('should throw NOT_FOUND if prompt belongs to another user', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      prismaMock.prompt.findFirst.mockResolvedValue(null);

      await expect(
        caller.getById({ id: '550e8400-e29b-41d4-a716-446655440098' })
      ).rejects.toThrow('Prompt not found');
    });
  });

  describe('create', () => {
    it('should create a new prompt', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const mockPrompt = createTestPrompt();
      prismaMock.prompt.create.mockResolvedValue(mockPrompt as any);
      prismaMock.promptVersion.create.mockResolvedValue({} as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      const input = {
        title: 'New Prompt',
        content: 'Prompt content',
        description: 'Description',
        variables: [],
        tagIds: [],
      };

      const result = await caller.create(input);

      expect(result.title).toBe(mockPrompt.title);
      expect(prismaMock.prompt.create).toHaveBeenCalled();
      expect(prismaMock.promptVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            versionNumber: 1,
            changesSummary: 'Initial version',
            isSnapshot: true,
          }),
        })
      );
      expect(prismaMock.activityLog.create).toHaveBeenCalled();
    });

    it('should verify folder exists when creating prompt with folder', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const folderId = '550e8400-e29b-41d4-a716-446655440001';
      prismaMock.folder.findFirst.mockResolvedValue(createTestFolder() as any);
      prismaMock.prompt.create.mockResolvedValue(createTestPrompt() as any);
      prismaMock.promptVersion.create.mockResolvedValue({} as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      await caller.create({
        title: 'Test',
        content: 'Content',
        folderId,
      });

      expect(prismaMock.folder.findFirst).toHaveBeenCalledWith({
        where: {
          id: folderId,
          userId: '550e8400-e29b-41d4-a716-446655440000',
        },
      });
    });

    it('should throw NOT_FOUND if folder does not exist', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      prismaMock.folder.findFirst.mockResolvedValue(null);

      await expect(
        caller.create({
          title: 'Test',
          content: 'Content',
          folderId: '550e8400-e29b-41d4-a716-446655440099',
        })
      ).rejects.toThrow('Folder not found');
    });

    it('should verify tags exist when creating prompt with tags', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const tagIds = ['550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440021'];
      prismaMock.tag.findMany.mockResolvedValue([
        createTestTag({ id: '550e8400-e29b-41d4-a716-446655440020' }) as any,
        createTestTag({ id: '550e8400-e29b-41d4-a716-446655440021' }) as any,
      ]);
      prismaMock.prompt.create.mockResolvedValue(createTestPrompt() as any);
      prismaMock.promptVersion.create.mockResolvedValue({} as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      await caller.create({
        title: 'Test',
        content: 'Content',
        tagIds,
      });

      expect(prismaMock.tag.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: tagIds },
          userId: '550e8400-e29b-41d4-a716-446655440000',
        },
      });
    });

    it('should throw NOT_FOUND if any tag does not exist', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      prismaMock.tag.findMany.mockResolvedValue([createTestTag() as any]); // Only one tag found

      await expect(
        caller.create({
          title: 'Test',
          content: 'Content',
          tagIds: ['550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440021'],
        })
      ).rejects.toThrow('One or more tags not found');
    });
  });

  describe('update', () => {
    it('should update a prompt', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const existingPrompt = createTestPrompt();
      const updatedPrompt = { ...existingPrompt, title: 'Updated Title' };

      prismaMock.prompt.findFirst.mockResolvedValue({
        ...existingPrompt,
        versions: [],
      } as any);
      prismaMock.prompt.update.mockResolvedValue(updatedPrompt as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      const result = await caller.update({
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
      expect(prismaMock.prompt.update).toHaveBeenCalled();
      expect(prismaMock.activityLog.create).toHaveBeenCalled();
    });

    it('should create new version when content is updated', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const existingPrompt = createTestPrompt({ content: 'Old content' });
      const lastVersion = createTestPromptVersion({ versionNumber: 1 });

      prismaMock.prompt.findFirst.mockResolvedValue({
        ...existingPrompt,
        versions: [lastVersion],
      } as any);
      prismaMock.prompt.update.mockResolvedValue({
        ...existingPrompt,
        content: 'New content',
      } as any);
      prismaMock.promptVersion.create.mockResolvedValue({} as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      await caller.update({
        id: '550e8400-e29b-41d4-a716-446655440003',
        content: 'New content',
      });

      expect(prismaMock.promptVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            versionNumber: 2,
            changesSummary: 'Content updated',
          }),
        })
      );
    });

    it('should throw NOT_FOUND if prompt does not exist', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      prismaMock.prompt.findFirst.mockResolvedValue(null);

      await expect(
        caller.update({ id: '550e8400-e29b-41d4-a716-446655440099', title: 'New Title' })
      ).rejects.toThrow('Prompt not found');
    });

    it('should update tags when tagIds is provided', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const existingPrompt = createTestPrompt();
      const tagIds = ['550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440021'];

      prismaMock.prompt.findFirst.mockResolvedValue({
        ...existingPrompt,
        versions: [],
      } as any);
      prismaMock.tag.findMany.mockResolvedValue([
        createTestTag({ id: '550e8400-e29b-41d4-a716-446655440020' }) as any,
        createTestTag({ id: '550e8400-e29b-41d4-a716-446655440021' }) as any,
      ]);
      prismaMock.promptTag.deleteMany.mockResolvedValue({} as any);
      prismaMock.prompt.update.mockResolvedValue(existingPrompt as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      await caller.update({
        id: '550e8400-e29b-41d4-a716-446655440003',
        tagIds,
      });

      expect(prismaMock.promptTag.deleteMany).toHaveBeenCalledWith({
        where: { promptId: '550e8400-e29b-41d4-a716-446655440003' },
      });
    });
  });

  describe('delete', () => {
    it('should soft delete a prompt', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const mockPrompt = createTestPrompt();
      prismaMock.prompt.findFirst.mockResolvedValue(mockPrompt as any);
      prismaMock.prompt.update.mockResolvedValue({ ...mockPrompt, isDeleted: true } as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      const result = await caller.delete({ id: '550e8400-e29b-41d4-a716-446655440003' });

      expect(result.success).toBe(true);
      expect(prismaMock.prompt.update).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440003' },
        data: { isDeleted: true },
      });
      expect(prismaMock.activityLog.create).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND if prompt does not exist', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      prismaMock.prompt.findFirst.mockResolvedValue(null);

      await expect(
        caller.delete({ id: '550e8400-e29b-41d4-a716-446655440099' })
      ).rejects.toThrow('Prompt not found');
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status to true', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const mockPrompt = createTestPrompt({ isFavorite: false });
      prismaMock.prompt.findFirst.mockResolvedValue(mockPrompt as any);
      prismaMock.prompt.update.mockResolvedValue({ ...mockPrompt, isFavorite: true } as any);

      const result = await caller.toggleFavorite({ id: '550e8400-e29b-41d4-a716-446655440003' });

      expect(result.isFavorite).toBe(true);
      expect(prismaMock.prompt.update).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440003' },
        data: { isFavorite: true },
      });
    });

    it('should toggle favorite status to false', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const mockPrompt = createTestPrompt({ isFavorite: true });
      prismaMock.prompt.findFirst.mockResolvedValue(mockPrompt as any);
      prismaMock.prompt.update.mockResolvedValue({ ...mockPrompt, isFavorite: false } as any);

      const result = await caller.toggleFavorite({ id: '550e8400-e29b-41d4-a716-446655440003' });

      expect(result.isFavorite).toBe(false);
    });
  });

  describe('bulkMove', () => {
    it('should move multiple prompts to a folder', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const promptIds = ['550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440031'];
      const folderId = '550e8400-e29b-41d4-a716-446655440001';

      prismaMock.prompt.findMany.mockResolvedValue([
        createTestPrompt({ id: '550e8400-e29b-41d4-a716-446655440030' }) as any,
        createTestPrompt({ id: '550e8400-e29b-41d4-a716-446655440031' }) as any,
      ]);
      prismaMock.folder.findFirst.mockResolvedValue(createTestFolder() as any);
      prismaMock.prompt.updateMany.mockResolvedValue({ count: 2 } as any);

      const result = await caller.bulkMove({ promptIds, folderId });

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(prismaMock.prompt.updateMany).toHaveBeenCalledWith({
        where: { id: { in: promptIds } },
        data: { folderId },
      });
    });

    it('should throw NOT_FOUND if any prompt does not exist', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      prismaMock.prompt.findMany.mockResolvedValue([createTestPrompt() as any]); // Only one found

      await expect(
        caller.bulkMove({ promptIds: ['550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440031'], folderId: null })
      ).rejects.toThrow('One or more prompts not found');
    });
  });

  describe('bulkDelete', () => {
    it('should soft delete multiple prompts', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const promptIds = ['550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440031'];

      prismaMock.prompt.findMany.mockResolvedValue([
        createTestPrompt({ id: '550e8400-e29b-41d4-a716-446655440030' }) as any,
        createTestPrompt({ id: '550e8400-e29b-41d4-a716-446655440031' }) as any,
      ]);
      prismaMock.prompt.updateMany.mockResolvedValue({ count: 2 } as any);

      const result = await caller.bulkDelete({ promptIds });

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(prismaMock.prompt.updateMany).toHaveBeenCalledWith({
        where: { id: { in: promptIds } },
        data: { isDeleted: true },
      });
    });
  });

  describe('getStats', () => {
    it('should return prompt statistics', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      prismaMock.prompt.count.mockResolvedValueOnce(10); // total
      prismaMock.prompt.count.mockResolvedValueOnce(3); // favorites
      prismaMock.prompt.groupBy.mockResolvedValueOnce([]); // byFolder
      prismaMock.prompt.groupBy.mockResolvedValueOnce([]); // byPrivacy

      const result = await caller.getStats();

      expect(result.total).toBe(10);
      expect(result.favorites).toBe(3);
      expect(result.byFolder).toEqual([]);
      expect(result.byPrivacy).toEqual([]);
    });
  });

  describe('getPromptsChat', () => {
    const mockCSV = `act,prompt,for_devs,type,contributor
"Linux Terminal","I want you to act as a linux terminal. I will type commands and you will reply with what the terminal should show.",TRUE,TEXT,contributor1
"JavaScript Console","I want you to act as a javascript console.",TRUE,TEXT,contributor2
"Excel Sheet","I want you to act as a text based excel.",FALSE,TEXT,contributor3`;

    beforeEach(() => {
      // Mock fetch globally
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should fetch and parse prompts from prompts.chat', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => mockCSV,
      });

      const ctx = createMockContext({ authenticated: false });
      const caller = promptRouter.createCaller(ctx);

      const result = await caller.getPromptsChat({});

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        title: 'Linux Terminal',
        content: expect.stringContaining('linux terminal'),
        source: 'prompts.chat',
      });
      expect(result[0].id).toMatch(/^prompts-chat-/);
    });

    it('should filter prompts by search query', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => mockCSV,
      });

      const ctx = createMockContext({ authenticated: false });
      const caller = promptRouter.createCaller(ctx);

      const result = await caller.getPromptsChat({ search: 'javascript' });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('JavaScript Console');
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const ctx = createMockContext({ authenticated: false });
      const caller = promptRouter.createCaller(ctx);

      await expect(caller.getPromptsChat({})).rejects.toThrow(TRPCError);
    });

    it('should use environment variable for CSV URL', async () => {
      const customUrl = 'https://example.com/custom-prompts.csv';
      process.env.PROMPTS_CHAT_CSV_URL = customUrl;

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => mockCSV,
      });

      const ctx = createMockContext({ authenticated: false });
      const caller = promptRouter.createCaller(ctx);

      await caller.getPromptsChat({});

      expect(global.fetch).toHaveBeenCalledWith(customUrl);

      delete process.env.PROMPTS_CHAT_CSV_URL;
    });
  });

  describe('copyFromPromptsChat', () => {
    it('should copy prompt from prompts.chat to user library', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const mockPrompt = createTestPrompt({
        id: 'new-prompt-id',
        title: 'Linux Terminal',
        content: 'I want you to act as a linux terminal.',
      });

      prismaMock.prompt.create.mockResolvedValue(mockPrompt as any);
      prismaMock.promptVersion.create.mockResolvedValue({} as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      const result = await caller.copyFromPromptsChat({
        title: 'Linux Terminal',
        content: 'I want you to act as a linux terminal.',
        folderId: null,
      });

      expect(result.title).toBe('Linux Terminal');
      expect(prismaMock.prompt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Linux Terminal',
            content: 'I want you to act as a linux terminal.',
            privacy: 'private',
            userId: '550e8400-e29b-41d4-a716-446655440000',
          }),
        })
      );
      expect(prismaMock.promptVersion.create).toHaveBeenCalled();
      expect(prismaMock.activityLog.create).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      const ctx = createMockContext({ authenticated: false });
      const caller = promptRouter.createCaller(ctx);

      await expect(
        caller.copyFromPromptsChat({
          title: 'Test',
          content: 'Test content',
          folderId: null,
        })
      ).rejects.toThrow();
    });

    it('should support custom folder assignment', async () => {
      const ctx = createMockContext();
      const caller = promptRouter.createCaller(ctx);

      const folderId = '550e8400-e29b-41d4-a716-446655440001';
      const mockPrompt = createTestPrompt({
        id: 'new-prompt-id',
        folderId,
      });

      prismaMock.prompt.create.mockResolvedValue(mockPrompt as any);
      prismaMock.promptVersion.create.mockResolvedValue({} as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      await caller.copyFromPromptsChat({
        title: 'Test',
        content: 'Test content',
        folderId,
      });

      expect(prismaMock.prompt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            folderId,
          }),
        })
      );
    });
  });
});
