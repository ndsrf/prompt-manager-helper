import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const versionRouter = createTRPCRouter({
  // Get all versions for a prompt
  getAll: protectedProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify prompt belongs to user
      const prompt = await ctx.prisma.prompt.findFirst({
        where: {
          id: input.promptId,
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

      const [versions, total] = await Promise.all([
        ctx.prisma.promptVersion.findMany({
          where: {
            promptId: input.promptId,
          },
          orderBy: {
            versionNumber: 'desc',
          },
          take: input.limit,
          skip: input.offset,
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        }),
        ctx.prisma.promptVersion.count({
          where: {
            promptId: input.promptId,
          },
        }),
      ]);

      return {
        versions,
        total,
      };
    }),

  // Get a specific version
  getById: protectedProcedure
    .input(
      z.object({
        versionId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const version = await ctx.prisma.promptVersion.findUnique({
        where: {
          id: input.versionId,
        },
        include: {
          prompt: {
            select: {
              id: true,
              userId: true,
              title: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (!version) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Version not found',
        });
      }

      // Verify user owns the prompt
      if (version.prompt.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this version',
        });
      }

      return version;
    }),

  // Compare two versions
  compare: protectedProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
        versionId1: z.string().uuid(),
        versionId2: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify prompt belongs to user
      const prompt = await ctx.prisma.prompt.findFirst({
        where: {
          id: input.promptId,
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

      // Get both versions
      const [version1, version2] = await Promise.all([
        ctx.prisma.promptVersion.findUnique({
          where: { id: input.versionId1 },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        }),
        ctx.prisma.promptVersion.findUnique({
          where: { id: input.versionId2 },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        }),
      ]);

      if (!version1 || !version2) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or both versions not found',
        });
      }

      // Verify both versions belong to the same prompt
      if (version1.promptId !== input.promptId || version2.promptId !== input.promptId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Versions must belong to the same prompt',
        });
      }

      return {
        version1,
        version2,
      };
    }),

  // Restore a version (creates a new version with old content)
  restore: protectedProcedure
    .input(
      z.object({
        versionId: z.string().uuid(),
        annotation: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get the version to restore
      const versionToRestore = await ctx.prisma.promptVersion.findUnique({
        where: {
          id: input.versionId,
        },
        include: {
          prompt: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      });

      if (!versionToRestore) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Version not found',
        });
      }

      // Verify user owns the prompt
      if (versionToRestore.prompt.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to restore this version',
        });
      }

      // Get the latest version number
      const latestVersion = await ctx.prisma.promptVersion.findFirst({
        where: {
          promptId: versionToRestore.promptId,
        },
        orderBy: {
          versionNumber: 'desc',
        },
      });

      const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

      // Update the prompt with the old content
      const updatedPrompt = await ctx.prisma.prompt.update({
        where: {
          id: versionToRestore.promptId,
        },
        data: {
          title: versionToRestore.title,
          content: versionToRestore.content,
          variables: versionToRestore.variables as any,
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

      // Create a new version
      const newVersion = await ctx.prisma.promptVersion.create({
        data: {
          promptId: versionToRestore.promptId,
          versionNumber: newVersionNumber,
          title: versionToRestore.title,
          content: versionToRestore.content,
          variables: versionToRestore.variables as any,
          changesSummary: `Restored from version ${versionToRestore.versionNumber}`,
          annotation: input.annotation,
          isSnapshot: true,
          createdBy: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'version_restored',
          entityType: 'prompt',
          entityId: versionToRestore.promptId,
          metadata: {
            restoredVersionNumber: versionToRestore.versionNumber,
            newVersionNumber,
          },
        },
      });

      return {
        prompt: updatedPrompt,
        version: newVersion,
      };
    }),

  // Create a manual snapshot
  createSnapshot: protectedProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
        annotation: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify prompt belongs to user
      const prompt = await ctx.prisma.prompt.findFirst({
        where: {
          id: input.promptId,
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

      // Get the latest version number
      const latestVersion = await ctx.prisma.promptVersion.findFirst({
        where: {
          promptId: input.promptId,
        },
        orderBy: {
          versionNumber: 'desc',
        },
      });

      const newVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

      // Create the snapshot
      const snapshot = await ctx.prisma.promptVersion.create({
        data: {
          promptId: input.promptId,
          versionNumber: newVersionNumber,
          title: prompt.title,
          content: prompt.content,
          variables: prompt.variables as any,
          changesSummary: 'Manual snapshot',
          annotation: input.annotation,
          isSnapshot: true,
          createdBy: userId,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'snapshot_created',
          entityType: 'prompt',
          entityId: input.promptId,
          metadata: {
            versionNumber: newVersionNumber,
            annotation: input.annotation,
          },
        },
      });

      return snapshot;
    }),

  // Update version annotation
  updateAnnotation: protectedProcedure
    .input(
      z.object({
        versionId: z.string().uuid(),
        annotation: z.string().max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get the version
      const version = await ctx.prisma.promptVersion.findUnique({
        where: {
          id: input.versionId,
        },
        include: {
          prompt: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      });

      if (!version) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Version not found',
        });
      }

      // Verify user owns the prompt
      if (version.prompt.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this version',
        });
      }

      // Update the annotation
      const updatedVersion = await ctx.prisma.promptVersion.update({
        where: {
          id: input.versionId,
        },
        data: {
          annotation: input.annotation,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      return updatedVersion;
    }),

  // Delete a version (only non-snapshot versions can be deleted)
  delete: protectedProcedure
    .input(
      z.object({
        versionId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get the version
      const version = await ctx.prisma.promptVersion.findUnique({
        where: {
          id: input.versionId,
        },
        include: {
          prompt: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      });

      if (!version) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Version not found',
        });
      }

      // Verify user owns the prompt
      if (version.prompt.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this version',
        });
      }

      // Cannot delete snapshots
      if (version.isSnapshot) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete snapshot versions',
        });
      }

      // Cannot delete the only version
      const versionCount = await ctx.prisma.promptVersion.count({
        where: {
          promptId: version.promptId,
        },
      });

      if (versionCount <= 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete the only version',
        });
      }

      // Delete the version
      await ctx.prisma.promptVersion.delete({
        where: {
          id: input.versionId,
        },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'version_deleted',
          entityType: 'prompt',
          entityId: version.promptId,
          metadata: {
            versionNumber: version.versionNumber,
          },
        },
      });

      return { success: true };
    }),
});
