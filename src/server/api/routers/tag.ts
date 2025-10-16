import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const tagRouter = createTRPCRouter({
  // Get all tags for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const tags = await ctx.prisma.tag.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            prompts: true,
          },
        },
      },
    });

    return tags;
  }),

  // Get a single tag by ID
  getById: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const tag = await ctx.prisma.tag.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          _count: {
            select: {
              prompts: true,
            },
          },
        },
      });

      if (!tag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tag not found',
        });
      }

      return tag;
    }),

  // Create a new tag
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if tag with same name already exists for this user
      const existing = await ctx.prisma.tag.findUnique({
        where: {
          userId_name: {
            userId,
            name: input.name,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A tag with this name already exists',
        });
      }

      // Create the tag
      const tag = await ctx.prisma.tag.create({
        data: {
          name: input.name,
          color: input.color || generateRandomColor(),
          userId,
        },
        include: {
          _count: {
            select: {
              prompts: true,
            },
          },
        },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'created',
          entityType: 'tag',
          entityId: tag.id,
          metadata: {
            name: tag.name,
            color: tag.color,
          },
        },
      });

      return tag;
    }),

  // Update a tag
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify tag exists and belongs to user
      const existingTag = await ctx.prisma.tag.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!existingTag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tag not found',
        });
      }

      // If updating name, check for duplicates
      if (input.name && input.name !== existingTag.name) {
        const duplicate = await ctx.prisma.tag.findUnique({
          where: {
            userId_name: {
              userId,
              name: input.name,
            },
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A tag with this name already exists',
          });
        }
      }

      // Update the tag
      const tag = await ctx.prisma.tag.update({
        where: { id: input.id },
        data: {
          name: input.name,
          color: input.color,
        },
        include: {
          _count: {
            select: {
              prompts: true,
            },
          },
        },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'updated',
          entityType: 'tag',
          entityId: tag.id,
          metadata: {
            name: tag.name,
            changes: input,
          },
        },
      });

      return tag;
    }),

  // Delete a tag
  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify tag exists and belongs to user
      const tag = await ctx.prisma.tag.findFirst({
        where: {
          id: input.id,
          userId,
        },
        include: {
          _count: {
            select: {
              prompts: true,
            },
          },
        },
      });

      if (!tag) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tag not found',
        });
      }

      // Delete the tag (prompt_tags relationships will be deleted via cascade)
      await ctx.prisma.tag.delete({
        where: { id: input.id },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'deleted',
          entityType: 'tag',
          entityId: input.id,
          metadata: {
            name: tag.name,
            promptCount: tag._count.prompts,
          },
        },
      });

      return { success: true };
    }),

  // Get tag usage statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const tags = await ctx.prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            prompts: true,
          },
        },
      },
      orderBy: {
        prompts: {
          _count: 'desc',
        },
      },
      take: 10, // Top 10 most used tags
    });

    return tags;
  }),

  // Search tags by name (for autocomplete)
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const tags = await ctx.prisma.tag.findMany({
        where: {
          userId: ctx.session.user.id,
          name: {
            contains: input.query,
            mode: 'insensitive',
          },
        },
        orderBy: {
          name: 'asc',
        },
        take: input.limit,
        include: {
          _count: {
            select: {
              prompts: true,
            },
          },
        },
      });

      return tags;
    }),
});

// Helper function to generate a random color
function generateRandomColor(): string {
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}
