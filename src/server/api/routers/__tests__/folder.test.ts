import { folderRouter } from '../folder';
import {
  createMockContext,
  prismaMock,
  createTestFolder,
} from '../../test-utils';

describe('folderRouter', () => {
  describe('getAll', () => {
    it('should return all folders for the current user', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const mockFolders = [
        createTestFolder({ id: '1', name: 'Folder 1' }),
        createTestFolder({ id: '2', name: 'Folder 2' }),
      ];

      prismaMock.folder.findMany.mockResolvedValue(mockFolders as any);

      const result = await caller.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Folder 1');
      expect(prismaMock.folder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: '550e8400-e29b-41d4-a716-446655440000',
          },
        })
      );
    });

    it('should order folders by path and name', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      prismaMock.folder.findMany.mockResolvedValue([]);

      await caller.getAll();

      expect(prismaMock.folder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { path: 'asc' },
            { name: 'asc' },
          ],
        })
      );
    });
  });

  describe('getById', () => {
    it('should return a folder by ID', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const mockFolder = createTestFolder();
      prismaMock.folder.findFirst.mockResolvedValue(mockFolder as any);

      const result = await caller.getById({ id: '550e8400-e29b-41d4-a716-446655440001' });

      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(prismaMock.folder.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            userId: '550e8400-e29b-41d4-a716-446655440000',
          },
        })
      );
    });

    it('should throw NOT_FOUND if folder does not exist', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      prismaMock.folder.findFirst.mockResolvedValue(null);

      await expect(
        caller.getById({ id: '550e8400-e29b-41d4-a716-446655440099' })
      ).rejects.toThrow('Folder not found');
    });

    it('should include parent and children in response', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      prismaMock.folder.findFirst.mockResolvedValue(createTestFolder() as any);

      await caller.getById({ id: '550e8400-e29b-41d4-a716-446655440001' });

      expect(prismaMock.folder.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            parent: true,
            children: {
              orderBy: { name: 'asc' },
            },
          }),
        })
      );
    });
  });

  describe('create', () => {
    it('should create a root folder', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const mockFolder = createTestFolder({ name: 'New Folder' });
      prismaMock.folder.create.mockResolvedValue(mockFolder as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      const result = await caller.create({
        name: 'New Folder',
        description: 'Test description',
      });

      expect(result.name).toBe('New Folder');
      expect(prismaMock.folder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Folder',
            description: 'Test description',
            userId: '550e8400-e29b-41d4-a716-446655440000',
            level: 0,
            path: '',
          }),
        })
      );
      expect(prismaMock.activityLog.create).toHaveBeenCalled();
    });

    it('should create a nested folder', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const parentFolder = createTestFolder({
        id: '550e8400-e29b-41d4-a716-446655440010',
        level: 0,
        path: '',
      });
      const newFolder = createTestFolder({
        name: 'Child Folder',
        parentId: '550e8400-e29b-41d4-a716-446655440010',
        level: 1,
      });

      prismaMock.folder.findFirst.mockResolvedValue(parentFolder as any);
      prismaMock.folder.create.mockResolvedValue(newFolder as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      const result = await caller.create({
        name: 'Child Folder',
        parentId: '550e8400-e29b-41d4-a716-446655440010',
      });

      expect(result.level).toBe(1);
      expect(prismaMock.folder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            level: 1,
            parentId: '550e8400-e29b-41d4-a716-446655440010',
          }),
        })
      );
    });

    it('should throw NOT_FOUND if parent folder does not exist', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      prismaMock.folder.findFirst.mockResolvedValue(null);

      await expect(
        caller.create({
          name: 'Test',
          parentId: '550e8400-e29b-41d4-a716-446655440099',
        })
      ).rejects.toThrow('Parent folder not found');
    });

    it('should throw BAD_REQUEST if max nesting level is reached', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const parentFolder = createTestFolder({ level: 4 }); // Max level
      prismaMock.folder.findFirst.mockResolvedValue(parentFolder as any);

      await expect(
        caller.create({
          name: 'Test',
          parentId: '550e8400-e29b-41d4-a716-446655440010',
        })
      ).rejects.toThrow('Maximum folder nesting level (5) reached');
    });

    it('should calculate correct path for nested folders', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const parentFolder = createTestFolder({
        id: '550e8400-e29b-41d4-a716-446655440010',
        level: 1,
        path: '550e8400-e29b-41d4-a716-446655440012/550e8400-e29b-41d4-a716-446655440010',
      });

      prismaMock.folder.findFirst.mockResolvedValue(parentFolder as any);
      prismaMock.folder.create.mockResolvedValue(createTestFolder() as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      await caller.create({
        name: 'Child',
        parentId: '550e8400-e29b-41d4-a716-446655440010',
      });

      expect(prismaMock.folder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            path: '550e8400-e29b-41d4-a716-446655440012/550e8400-e29b-41d4-a716-446655440010/550e8400-e29b-41d4-a716-446655440010',
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should update folder name and description', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const existingFolder = createTestFolder();
      const updatedFolder = { ...existingFolder, name: 'Updated Name' };

      prismaMock.folder.findFirst.mockResolvedValue(existingFolder as any);
      prismaMock.folder.update.mockResolvedValue(updatedFolder as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      const result = await caller.update({
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(result.name).toBe('Updated Name');
      expect(prismaMock.folder.update).toHaveBeenCalled();
      expect(prismaMock.activityLog.create).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND if folder does not exist', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      prismaMock.folder.findFirst.mockResolvedValue(null);

      await expect(
        caller.update({ id: '550e8400-e29b-41d4-a716-446655440099', name: 'Test' })
      ).rejects.toThrow('Folder not found');
    });

    it('should throw BAD_REQUEST if trying to set folder as its own parent', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const existingFolder = createTestFolder({ id: '550e8400-e29b-41d4-a716-446655440013' });
      prismaMock.folder.findFirst.mockResolvedValue(existingFolder as any);

      await expect(
        caller.update({
          id: '550e8400-e29b-41d4-a716-446655440013',
          parentId: '550e8400-e29b-41d4-a716-446655440013',
        })
      ).rejects.toThrow('A folder cannot be its own parent');
    });

    it('should throw BAD_REQUEST if trying to move folder into its own subfolder', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const existingFolder = createTestFolder({ id: '550e8400-e29b-41d4-a716-446655440010' });
      const descendantFolder = createTestFolder({
        id: '550e8400-e29b-41d4-a716-446655440011',
        path: '550e8400-e29b-41d4-a716-446655440010/550e8400-e29b-41d4-a716-446655440011',
      });

      prismaMock.folder.findFirst
        .mockResolvedValueOnce(existingFolder as any) // existing folder
        .mockResolvedValueOnce(descendantFolder as any); // new parent

      await expect(
        caller.update({
          id: '550e8400-e29b-41d4-a716-446655440010',
          parentId: '550e8400-e29b-41d4-a716-446655440011',
        })
      ).rejects.toThrow('Cannot move a folder into its own subfolder');
    });

    it('should move folder to root level', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const existingFolder = createTestFolder({
        parentId: 'old-parent',
        level: 2,
        path: 'grandparent/parent',
      });

      prismaMock.folder.findFirst.mockResolvedValue(existingFolder as any);
      prismaMock.folder.findMany.mockResolvedValue([]); // Mock descendants query
      prismaMock.folder.update.mockResolvedValue({
        ...existingFolder,
        parentId: null,
        level: 0,
        path: '',
      } as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      await caller.update({
        id: '550e8400-e29b-41d4-a716-446655440001',
        parentId: null,
      });

      expect(prismaMock.folder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            level: 0,
            path: '',
            parentId: null,
          }),
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete a folder', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const mockFolder = createTestFolder();
      prismaMock.folder.findFirst.mockResolvedValue({
        ...mockFolder,
        _count: { children: 0, prompts: 0 },
      } as any);
      prismaMock.folder.delete.mockResolvedValue(mockFolder as any);
      prismaMock.activityLog.create.mockResolvedValue({} as any);

      const result = await caller.delete({ id: '550e8400-e29b-41d4-a716-446655440001' });

      expect(result.success).toBe(true);
      expect(prismaMock.folder.delete).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440001' },
      });
      expect(prismaMock.activityLog.create).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND if folder does not exist', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      prismaMock.folder.findFirst.mockResolvedValue(null);

      await expect(
        caller.delete({ id: '550e8400-e29b-41d4-a716-446655440099' })
      ).rejects.toThrow('Folder not found');
    });

    it('should throw BAD_REQUEST if folder has children', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const folderWithChildren = createTestFolder();
      prismaMock.folder.findFirst.mockResolvedValue({
        ...folderWithChildren,
        _count: { children: 2, prompts: 0 },
      } as any);

      await expect(
        caller.delete({ id: '550e8400-e29b-41d4-a716-446655440001' })
      ).rejects.toThrow('Cannot delete a folder that contains subfolders');
    });
  });

  describe('getTree', () => {
    it('should return folder tree structure', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const rootFolder = createTestFolder({
        id: 'root',
        name: 'Root',
        parentId: null,
        level: 0,
      });
      const childFolder = createTestFolder({
        id: 'child',
        name: 'Child',
        parentId: 'root',
        level: 1,
      });

      prismaMock.folder.findMany.mockResolvedValue([
        rootFolder,
        childFolder,
      ] as any);

      const result = await caller.getTree();

      expect(result).toHaveLength(1); // One root folder
      expect(result[0].id).toBe('root');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('child');
    });

    it('should handle multiple root folders', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const folder1 = createTestFolder({
        id: 'root1',
        parentId: null,
        level: 0,
      });
      const folder2 = createTestFolder({
        id: 'root2',
        parentId: null,
        level: 0,
      });

      prismaMock.folder.findMany.mockResolvedValue([
        folder1,
        folder2,
      ] as any);

      const result = await caller.getTree();

      expect(result).toHaveLength(2);
    });

    it('should handle complex nested structures', async () => {
      const ctx = createMockContext();
      const caller = folderRouter.createCaller(ctx);

      const root = createTestFolder({
        id: 'root',
        parentId: null,
        level: 0,
      });
      const child1 = createTestFolder({
        id: 'child1',
        parentId: 'root',
        level: 1,
      });
      const child2 = createTestFolder({
        id: 'child2',
        parentId: 'root',
        level: 1,
      });
      const grandchild = createTestFolder({
        id: 'grandchild',
        parentId: 'child1',
        level: 2,
      });

      prismaMock.folder.findMany.mockResolvedValue([
        root,
        child1,
        child2,
        grandchild,
      ] as any);

      const result = await caller.getTree();

      expect(result).toHaveLength(1); // One root
      expect(result[0].children).toHaveLength(2); // Two children
      expect(result[0].children[0].children).toHaveLength(1); // One grandchild
    });
  });
});
