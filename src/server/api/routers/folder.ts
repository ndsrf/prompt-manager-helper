import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const folderRouter = createTRPCRouter({
  // Get all folders for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const folders = await ctx.prisma.folder.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: [
        { path: 'asc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: {
            prompts: true,
            children: true,
          },
        },
      },
    });

    return folders;
  }),

  // Get a single folder by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const folder = await ctx.prisma.folder.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          parent: true,
          children: {
            orderBy: { name: 'asc' },
          },
          _count: {
            select: {
              prompts: true,
            },
          },
        },
      });

      if (!folder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Folder not found',
        });
      }

      return folder;
    }),

  // Create a new folder
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      parentId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // If parentId is provided, verify it exists and belongs to the user
      let parentFolder = null;
      let level = 0;
      let path = '';

      if (input.parentId) {
        parentFolder = await ctx.prisma.folder.findFirst({
          where: {
            id: input.parentId,
            userId,
          },
        });

        if (!parentFolder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Parent folder not found',
          });
        }

        // Check nesting level (max 5 levels)
        if (parentFolder.level >= 4) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Maximum folder nesting level (5) reached',
          });
        }

        level = parentFolder.level + 1;
        path = `${parentFolder.path || parentFolder.id}/${input.parentId}`;
      } else {
        path = '';
      }

      // Create the folder
      const folder = await ctx.prisma.folder.create({
        data: {
          name: input.name,
          description: input.description,
          userId,
          parentId: input.parentId,
          level,
          path,
        },
        include: {
          _count: {
            select: {
              prompts: true,
              children: true,
            },
          },
        },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'created',
          entityType: 'folder',
          entityId: folder.id,
          metadata: {
            name: folder.name,
            parentId: input.parentId,
          },
        },
      });

      return folder;
    }),

  // Update a folder
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      parentId: z.string().uuid().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify folder exists and belongs to user
      const existingFolder = await ctx.prisma.folder.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!existingFolder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Folder not found',
        });
      }

      let level = existingFolder.level;
      let path = existingFolder.path;

      // If moving to a different parent
      if (input.parentId !== undefined) {
        if (input.parentId === null) {
          // Moving to root
          level = 0;
          path = '';
        } else if (input.parentId === input.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'A folder cannot be its own parent',
          });
        } else {
          // Verify new parent exists and belongs to user
          const newParent = await ctx.prisma.folder.findFirst({
            where: {
              id: input.parentId,
              userId,
            },
          });

          if (!newParent) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Parent folder not found',
            });
          }

          // Check if new parent is a descendant of current folder (circular reference)
          if (newParent.path?.includes(input.id)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Cannot move a folder into its own subfolder',
            });
          }

          // Check nesting level
          if (newParent.level >= 4) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Maximum folder nesting level (5) reached',
            });
          }

          level = newParent.level + 1;
          path = `${newParent.path || newParent.id}/${input.parentId}`;
        }
      }

      // Update the folder
      const folder = await ctx.prisma.folder.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          parentId: input.parentId === undefined ? undefined : input.parentId,
          level,
          path,
        },
        include: {
          _count: {
            select: {
              prompts: true,
              children: true,
            },
          },
        },
      });

      // If path changed, update all descendants
      if (path !== existingFolder.path && path !== null) {
        await updateDescendantPaths(ctx.prisma, input.id, path);
      }

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'updated',
          entityType: 'folder',
          entityId: folder.id,
          metadata: {
            name: folder.name,
            changes: input,
          },
        },
      });

      return folder;
    }),

  // Delete a folder
  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify folder exists and belongs to user
      const folder = await ctx.prisma.folder.findFirst({
        where: {
          id: input.id,
          userId,
        },
        include: {
          _count: {
            select: {
              children: true,
              prompts: true,
            },
          },
        },
      });

      if (!folder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Folder not found',
        });
      }

      // Check if folder has children
      if (folder._count.children > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete a folder that contains subfolders. Please delete or move them first.',
        });
      }

      // Delete the folder (prompts will be moved to null folderId due to SetNull)
      await ctx.prisma.folder.delete({
        where: { id: input.id },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'deleted',
          entityType: 'folder',
          entityId: input.id,
          metadata: {
            name: folder.name,
            promptCount: folder._count.prompts,
          },
        },
      });

      return { success: true };
    }),

  // Get folder tree structure
  getTree: protectedProcedure.query(async ({ ctx }) => {
    const folders = await ctx.prisma.folder.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: {
            prompts: true,
            children: true,
          },
        },
      },
    });

    // Build tree structure
    const folderMap = new Map();
    const rootFolders: any[] = [];

    // First pass: create map of all folders
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Second pass: build tree
    folders.forEach(folder => {
      const folderNode = folderMap.get(folder.id);
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folderNode);
        }
      } else {
        rootFolders.push(folderNode);
      }
    });

    return rootFolders;
  }),
});

// Helper function to update descendant paths when a folder is moved
async function updateDescendantPaths(prisma: any, folderId: string, newPath: string) {
  const descendants = await prisma.folder.findMany({
    where: {
      path: {
        contains: folderId,
      },
    },
  });

  for (const descendant of descendants) {
    const oldPath = descendant.path || '';
    const updatedPath = oldPath.replace(
      new RegExp(`^${oldPath.split(folderId)[0]}${folderId}`),
      `${newPath}/${folderId}`
    );

    await prisma.folder.update({
      where: { id: descendant.id },
      data: {
        path: updatedPath,
        level: updatedPath.split('/').filter((p: string) => p).length,
      },
    });
  }
}
