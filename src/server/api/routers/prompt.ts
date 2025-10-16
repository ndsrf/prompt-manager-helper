import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

const variableSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'number', 'select']),
  default: z.string().optional(),
  options: z.array(z.string()).optional(), // for select type
});

export const promptRouter = createTRPCRouter({
  // Get all prompts for the current user with filtering and search
  getAll: protectedProcedure
    .input(z.object({
      folderId: z.string().uuid().optional().nullable(),
      tagIds: z.array(z.string().uuid()).optional(),
      search: z.string().optional(),
      favorites: z.boolean().optional(),
      privacy: z.enum(['private', 'shared', 'public']).optional(),
      sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'usageCount']).default('updatedAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Build where clause
      const where: Prisma.PromptWhereInput = {
        userId,
        isDeleted: false,
      };

      // Filter by folder
      if (input.folderId !== undefined) {
        where.folderId = input.folderId;
      }

      // Filter by tags
      if (input.tagIds && input.tagIds.length > 0) {
        where.tags = {
          some: {
            tagId: {
              in: input.tagIds,
            },
          },
        };
      }

      // Filter by favorites
      if (input.favorites) {
        where.isFavorite = true;
      }

      // Filter by privacy
      if (input.privacy) {
        where.privacy = input.privacy;
      }

      // Full-text search
      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
          { content: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      // Cursor pagination
      const cursorConfig = input.cursor
        ? {
            cursor: { id: input.cursor },
            skip: 1,
          }
        : {};

      // Build orderBy
      const orderBy: Prisma.PromptOrderByWithRelationInput = {
        [input.sortBy]: input.sortOrder,
      };

      const prompts = await ctx.prisma.prompt.findMany({
        where,
        orderBy,
        take: input.limit,
        ...cursorConfig,
        include: {
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              versions: true,
              comments: true,
            },
          },
        },
      });

      // Get next cursor
      const nextCursor = prompts.length === input.limit ? prompts[prompts.length - 1].id : undefined;

      return {
        prompts,
        nextCursor,
      };
    }),

  // Get a single prompt by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const prompt = await ctx.prisma.prompt.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
          isDeleted: false,
        },
        include: {
          folder: true,
          tags: {
            include: {
              tag: true,
            },
          },
          versions: {
            orderBy: {
              versionNumber: 'desc',
            },
            take: 5,
          },
          _count: {
            select: {
              versions: true,
              comments: true,
              usage: true,
            },
          },
        },
      });

      if (!prompt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prompt not found',
        });
      }

      return prompt;
    }),

  // Create a new prompt
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      content: z.string().min(1),
      variables: z.array(variableSchema).default([]),
      targetLlm: z.string().max(50).optional(),
      folderId: z.string().uuid().optional().nullable(),
      tagIds: z.array(z.string().uuid()).default([]),
      privacy: z.enum(['private', 'shared', 'public']).default('private'),
      isFavorite: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify folder exists if provided
      if (input.folderId) {
        const folder = await ctx.prisma.folder.findFirst({
          where: {
            id: input.folderId,
            userId,
          },
        });

        if (!folder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Folder not found',
          });
        }
      }

      // Verify all tags exist and belong to user
      if (input.tagIds.length > 0) {
        const tags = await ctx.prisma.tag.findMany({
          where: {
            id: { in: input.tagIds },
            userId,
          },
        });

        if (tags.length !== input.tagIds.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'One or more tags not found',
          });
        }
      }

      // Create the prompt
      const prompt = await ctx.prisma.prompt.create({
        data: {
          title: input.title,
          description: input.description,
          content: input.content,
          variables: input.variables as any,
          targetLlm: input.targetLlm,
          folderId: input.folderId,
          privacy: input.privacy,
          isFavorite: input.isFavorite,
          userId,
          tags: {
            create: input.tagIds.map(tagId => ({
              tagId,
            })),
          },
        },
        include: {
          folder: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      // Create initial version
      await ctx.prisma.promptVersion.create({
        data: {
          promptId: prompt.id,
          versionNumber: 1,
          title: prompt.title,
          content: prompt.content,
          variables: prompt.variables,
          changesSummary: 'Initial version',
          isSnapshot: true,
          createdBy: userId,
        },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'created',
          entityType: 'prompt',
          entityId: prompt.id,
          metadata: {
            title: prompt.title,
            folderId: input.folderId,
          },
        },
      });

      return prompt;
    }),

  // Update a prompt
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional().nullable(),
      content: z.string().min(1).optional(),
      variables: z.array(variableSchema).optional(),
      targetLlm: z.string().max(50).optional().nullable(),
      folderId: z.string().uuid().optional().nullable(),
      tagIds: z.array(z.string().uuid()).optional(),
      privacy: z.enum(['private', 'shared', 'public']).optional(),
      isFavorite: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify prompt exists and belongs to user
      const existingPrompt = await ctx.prisma.prompt.findFirst({
        where: {
          id: input.id,
          userId,
          isDeleted: false,
        },
        include: {
          versions: {
            orderBy: {
              versionNumber: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!existingPrompt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prompt not found',
        });
      }

      // Verify folder exists if provided
      if (input.folderId !== undefined && input.folderId !== null) {
        const folder = await ctx.prisma.folder.findFirst({
          where: {
            id: input.folderId,
            userId,
          },
        });

        if (!folder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Folder not found',
          });
        }
      }

      // Handle tag updates
      if (input.tagIds) {
        // Verify all tags exist and belong to user
        const tags = await ctx.prisma.tag.findMany({
          where: {
            id: { in: input.tagIds },
            userId,
          },
        });

        if (tags.length !== input.tagIds.length) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'One or more tags not found',
          });
        }

        // Delete existing tags and create new ones
        await ctx.prisma.promptTag.deleteMany({
          where: {
            promptId: input.id,
          },
        });
      }

      // Update the prompt
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.variables !== undefined) updateData.variables = input.variables;
      if (input.targetLlm !== undefined) updateData.targetLlm = input.targetLlm;
      if (input.folderId !== undefined) updateData.folderId = input.folderId;
      if (input.privacy !== undefined) updateData.privacy = input.privacy;
      if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;

      const prompt = await ctx.prisma.prompt.update({
        where: { id: input.id },
        data: {
          ...updateData,
          ...(input.tagIds && {
            tags: {
              create: input.tagIds.map(tagId => ({
                tagId,
              })),
            },
          }),
        },
        include: {
          folder: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      // Create new version if content changed
      if (input.content && input.content !== existingPrompt.content) {
        const lastVersion = existingPrompt.versions[0];
        const newVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

        await ctx.prisma.promptVersion.create({
          data: {
            promptId: prompt.id,
            versionNumber: newVersionNumber,
            title: prompt.title,
            content: prompt.content,
            variables: prompt.variables,
            changesSummary: 'Content updated',
            isSnapshot: false,
            createdBy: userId,
          },
        });
      }

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'updated',
          entityType: 'prompt',
          entityId: prompt.id,
          metadata: {
            title: prompt.title,
            changes: Object.keys(input).filter(k => k !== 'id'),
          },
        },
      });

      return prompt;
    }),

  // Soft delete a prompt
  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify prompt exists and belongs to user
      const prompt = await ctx.prisma.prompt.findFirst({
        where: {
          id: input.id,
          userId,
          isDeleted: false,
        },
      });

      if (!prompt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prompt not found',
        });
      }

      // Soft delete the prompt
      await ctx.prisma.prompt.update({
        where: { id: input.id },
        data: {
          isDeleted: true,
        },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'deleted',
          entityType: 'prompt',
          entityId: input.id,
          metadata: {
            title: prompt.title,
          },
        },
      });

      return { success: true };
    }),

  // Get trashed prompts
  getTrashed: protectedProcedure.query(async ({ ctx }) => {
    const prompts = await ctx.prisma.prompt.findMany({
      where: {
        userId: ctx.session.user.id,
        isDeleted: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return prompts;
  }),

  // Restore a deleted prompt
  restore: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify prompt exists and is deleted
      const prompt = await ctx.prisma.prompt.findFirst({
        where: {
          id: input.id,
          userId,
          isDeleted: true,
        },
      });

      if (!prompt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deleted prompt not found',
        });
      }

      // Restore the prompt
      await ctx.prisma.prompt.update({
        where: { id: input.id },
        data: {
          isDeleted: false,
        },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'restored',
          entityType: 'prompt',
          entityId: input.id,
          metadata: {
            title: prompt.title,
          },
        },
      });

      return { success: true };
    }),

  // Permanently delete a prompt
  permanentDelete: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify prompt exists and is deleted
      const prompt = await ctx.prisma.prompt.findFirst({
        where: {
          id: input.id,
          userId,
          isDeleted: true,
        },
      });

      if (!prompt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deleted prompt not found',
        });
      }

      // Permanently delete the prompt
      await ctx.prisma.prompt.delete({
        where: { id: input.id },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'permanently_deleted',
          entityType: 'prompt',
          entityId: input.id,
          metadata: {
            title: prompt.title,
          },
        },
      });

      return { success: true };
    }),

  // Toggle favorite status
  toggleFavorite: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const prompt = await ctx.prisma.prompt.findFirst({
        where: {
          id: input.id,
          userId,
          isDeleted: false,
        },
      });

      if (!prompt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prompt not found',
        });
      }

      const updated = await ctx.prisma.prompt.update({
        where: { id: input.id },
        data: {
          isFavorite: !prompt.isFavorite,
        },
      });

      return updated;
    }),

  // Bulk operations
  bulkMove: protectedProcedure
    .input(z.object({
      promptIds: z.array(z.string().uuid()).min(1),
      folderId: z.string().uuid().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify all prompts belong to user
      const prompts = await ctx.prisma.prompt.findMany({
        where: {
          id: { in: input.promptIds },
          userId,
          isDeleted: false,
        },
      });

      if (prompts.length !== input.promptIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or more prompts not found',
        });
      }

      // Verify folder exists if provided
      if (input.folderId) {
        const folder = await ctx.prisma.folder.findFirst({
          where: {
            id: input.folderId,
            userId,
          },
        });

        if (!folder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Folder not found',
          });
        }
      }

      // Move all prompts
      await ctx.prisma.prompt.updateMany({
        where: {
          id: { in: input.promptIds },
        },
        data: {
          folderId: input.folderId,
        },
      });

      return { success: true, count: prompts.length };
    }),

  bulkDelete: protectedProcedure
    .input(z.object({
      promptIds: z.array(z.string().uuid()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify all prompts belong to user
      const prompts = await ctx.prisma.prompt.findMany({
        where: {
          id: { in: input.promptIds },
          userId,
          isDeleted: false,
        },
      });

      if (prompts.length !== input.promptIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or more prompts not found',
        });
      }

      // Soft delete all prompts
      await ctx.prisma.prompt.updateMany({
        where: {
          id: { in: input.promptIds },
        },
        data: {
          isDeleted: true,
        },
      });

      return { success: true, count: prompts.length };
    }),

  bulkTag: protectedProcedure
    .input(z.object({
      promptIds: z.array(z.string().uuid()).min(1),
      tagIds: z.array(z.string().uuid()).min(1),
      action: z.enum(['add', 'remove']),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify all prompts belong to user
      const prompts = await ctx.prisma.prompt.findMany({
        where: {
          id: { in: input.promptIds },
          userId,
          isDeleted: false,
        },
      });

      if (prompts.length !== input.promptIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or more prompts not found',
        });
      }

      // Verify all tags belong to user
      const tags = await ctx.prisma.tag.findMany({
        where: {
          id: { in: input.tagIds },
          userId,
        },
      });

      if (tags.length !== input.tagIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or more tags not found',
        });
      }

      if (input.action === 'add') {
        // Add tags to all prompts
        const promptTags = input.promptIds.flatMap(promptId =>
          input.tagIds.map(tagId => ({
            promptId,
            tagId,
          }))
        );

        // Use createMany with skipDuplicates to avoid conflicts
        await ctx.prisma.promptTag.createMany({
          data: promptTags,
          skipDuplicates: true,
        });
      } else {
        // Remove tags from all prompts
        await ctx.prisma.promptTag.deleteMany({
          where: {
            promptId: { in: input.promptIds },
            tagId: { in: input.tagIds },
          },
        });
      }

      return { success: true, count: prompts.length };
    }),

  // Get recent prompts
  getRecent: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const prompts = await ctx.prisma.prompt.findMany({
        where: {
          userId: ctx.session.user.id,
          isDeleted: false,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: input.limit,
        include: {
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      return prompts;
    }),

  // Get prompt statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [total, favorites, byFolder, byPrivacy] = await Promise.all([
      ctx.prisma.prompt.count({
        where: { userId, isDeleted: false },
      }),
      ctx.prisma.prompt.count({
        where: { userId, isDeleted: false, isFavorite: true },
      }),
      ctx.prisma.prompt.groupBy({
        by: ['folderId'],
        where: { userId, isDeleted: false },
        _count: true,
      }),
      ctx.prisma.prompt.groupBy({
        by: ['privacy'],
        where: { userId, isDeleted: false },
        _count: true,
      }),
    ]);

    return {
      total,
      favorites,
      byFolder,
      byPrivacy,
    };
  }),
});
