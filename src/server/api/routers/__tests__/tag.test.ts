import { tagRouter } from '../tag';
import {
  createMockContext,
  prismaMock,
  createTestTag,
} from '../../test-utils';

describe('tagRouter', () => {
  describe('getAll', () => {
    it('should return all tags for the current user', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      const mockTags = [
        createTestTag({ id: '1', name: 'tag1' }),
        createTestTag({ id: '2', name: 'tag2' }),
      ];

      prismaMock.tag.findMany.mockResolvedValue(mockTags as any);

      const result = await caller.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('tag1');
      expect(prismaMock.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: '550e8400-e29b-41d4-a716-446655440000',
          },
          orderBy: {
            name: 'asc',
          },
        })
      );
    });
  });

  describe('getById', () => {
    it('should return a tag by ID', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      const mockTag = createTestTag();
      prismaMock.tag.findFirst.mockResolvedValue(mockTag as any);

      const result = await caller.getById({ id: '550e8400-e29b-41d4-a716-446655440002' });

      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440002');
      expect(prismaMock.tag.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            userId: '550e8400-e29b-41d4-a716-446655440000',
          },
        })
      );
    });

    it('should throw NOT_FOUND if tag does not exist', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      prismaMock.tag.findFirst.mockResolvedValue(null);

      await expect(
        caller.getById({ id: '550e8400-e29b-41d4-a716-446655440099' })
      ).rejects.toThrow('Tag not found');
    });
  });

  describe('create', () => {
    it('should create a new tag with provided color', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      const mockTag = createTestTag({ name: 'New Tag', color: '#FF5733' });
      prismaMock.tag.findUnique.mockResolvedValue(null); // No existing tag
      prismaMock.tag.create.mockResolvedValue(mockTag as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      const result = await caller.create({
        name: 'New Tag',
        color: '#FF5733',
      });

      expect(result.name).toBe('New Tag');
      expect(result.color).toBe('#FF5733');
      expect(prismaMock.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Tag',
            color: '#FF5733',
            userId: '550e8400-e29b-41d4-a716-446655440000',
          }),
        })
      );
      expect(prismaMock.activityLog.create).toHaveBeenCalled();
    });

    it('should create a new tag with random color if not provided', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      const mockTag = createTestTag({ name: 'New Tag' });
      prismaMock.tag.findUnique.mockResolvedValue(null);
      prismaMock.tag.create.mockResolvedValue(mockTag as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      await caller.create({ name: 'New Tag' });

      expect(prismaMock.tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Tag',
            color: expect.stringMatching(/^#[0-9A-Fa-f]{6}$/),
          }),
        })
      );
    });

    it('should throw CONFLICT if tag with same name already exists', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      prismaMock.tag.findUnique.mockResolvedValue(createTestTag({ name: 'Existing' }) as any);

      await expect(
        caller.create({ name: 'Existing' })
      ).rejects.toThrow('A tag with this name already exists');
    });

    it('should validate color format', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      // Invalid color format should be rejected by zod validation
      await expect(
        caller.create({ name: 'Test', color: 'invalid' })
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update tag name and color', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      const existingTag = createTestTag({ name: 'Old Name' });
      const updatedTag = { ...existingTag, name: 'New Name', color: '#FF0000' };

      prismaMock.tag.findFirst.mockResolvedValue(existingTag as any);
      prismaMock.tag.findUnique.mockResolvedValue(null); // No duplicate
      prismaMock.tag.update.mockResolvedValue(updatedTag as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      const result = await caller.update({
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'New Name',
        color: '#FF0000',
      });

      expect(result.name).toBe('New Name');
      expect(result.color).toBe('#FF0000');
      expect(prismaMock.tag.update).toHaveBeenCalled();
      expect(prismaMock.activityLog.create).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND if tag does not exist', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      prismaMock.tag.findFirst.mockResolvedValue(null);

      await expect(
        caller.update({ id: '550e8400-e29b-41d4-a716-446655440099', name: 'New Name' })
      ).rejects.toThrow('Tag not found');
    });

    it('should throw CONFLICT if new name conflicts with existing tag', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      const existingTag = createTestTag({ name: 'Old Name' });
      const duplicateTag = createTestTag({ id: '550e8400-e29b-41d4-a716-446655440010', name: 'New Name' });

      prismaMock.tag.findFirst.mockResolvedValue(existingTag as any);
      prismaMock.tag.findUnique.mockResolvedValue(duplicateTag as any);

      await expect(
        caller.update({ id: '550e8400-e29b-41d4-a716-446655440002', name: 'New Name' })
      ).rejects.toThrow('A tag with this name already exists');
    });

    it('should allow updating tag with same name', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      const existingTag = createTestTag({ name: 'Same Name' });

      prismaMock.tag.findFirst.mockResolvedValue(existingTag as any);
      prismaMock.tag.update.mockResolvedValue(existingTag as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      // Should not check for duplicates if name is unchanged
      await caller.update({
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Same Name',
        color: '#FF0000',
      });

      expect(prismaMock.tag.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a tag', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      const mockTag = createTestTag();
      prismaMock.tag.findFirst.mockResolvedValue({
        ...mockTag,
        _count: { prompts: 5 },
      } as any);
      prismaMock.tag.delete.mockResolvedValue(mockTag as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      const result = await caller.delete({ id: '550e8400-e29b-41d4-a716-446655440002' });

      expect(result.success).toBe(true);
      expect(prismaMock.tag.delete).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440002' },
      });
      expect(prismaMock.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              promptCount: 5,
            }),
          }),
        })
      );
    });

    it('should throw NOT_FOUND if tag does not exist', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      prismaMock.tag.findFirst.mockResolvedValue(null);

      await expect(
        caller.delete({ id: '550e8400-e29b-41d4-a716-446655440099' })
      ).rejects.toThrow('Tag not found');
    });
  });

  describe('getStats', () => {
    it('should return top 10 most used tags', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      const mockTags = Array.from({ length: 10 }, (_, i) =>
        createTestTag({ id: `tag-${i}`, name: `tag${i}` })
      );

      prismaMock.tag.findMany.mockResolvedValue(mockTags as any);

      const result = await caller.getStats();

      expect(result).toHaveLength(10);
      expect(prismaMock.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            prompts: {
              _count: 'desc',
            },
          },
          take: 10,
        })
      );
    });
  });

  describe('search', () => {
    it('should search tags by name', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      const mockTags = [
        createTestTag({ name: 'javascript' }),
        createTestTag({ name: 'typescript' }),
      ];

      prismaMock.tag.findMany.mockResolvedValue(mockTags as any);

      const result = await caller.search({ query: 'script' });

      expect(result).toHaveLength(2);
      expect(prismaMock.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: {
              contains: 'script',
              mode: 'insensitive',
            },
          }),
        })
      );
    });

    it('should respect limit parameter', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      prismaMock.tag.findMany.mockResolvedValue([]);

      await caller.search({ query: 'test', limit: 5 });

      expect(prismaMock.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should use default limit if not provided', async () => {
      const ctx = createMockContext();
      const caller = tagRouter.createCaller(ctx);

      prismaMock.tag.findMany.mockResolvedValue([]);

      await caller.search({ query: 'test' });

      expect(prismaMock.tag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });
  });
});
