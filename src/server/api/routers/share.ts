import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const shareRouter = createTRPCRouter({
  // Share a prompt with specific users
  shareWithUsers: protectedProcedure
    .input(
      z.object({
        promptId: z.string(),
        userEmails: z.array(z.string().email()),
        permission: z.enum(["view", "edit", "admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the prompt
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.promptId },
        include: { user: true },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      if (prompt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to share this prompt",
        });
      }

      // Find users by email
      const users = await ctx.prisma.user.findMany({
        where: {
          email: {
            in: input.userEmails,
          },
        },
      });

      if (users.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No users found with the provided emails",
        });
      }

      // Create shares for each user
      const shares = await Promise.all(
        users.map((user) =>
          ctx.prisma.promptShare.upsert({
            where: {
              promptId_sharedWithId: {
                promptId: input.promptId,
                sharedWithId: user.id,
              },
            },
            create: {
              promptId: input.promptId,
              sharedById: ctx.session.user.id,
              sharedWithId: user.id,
              permission: input.permission,
            },
            update: {
              permission: input.permission,
            },
          })
        )
      );

      // Update prompt privacy to 'shared' if it was private
      if (prompt.privacy === "private") {
        await ctx.prisma.prompt.update({
          where: { id: input.promptId },
          data: { privacy: "shared" },
        });
      }

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "shared",
          entityType: "prompt",
          entityId: input.promptId,
          metadata: {
            sharedWith: users.map((u) => u.email),
            permission: input.permission,
          },
        },
      });

      return {
        success: true,
        sharedCount: shares.length,
        notFoundEmails: input.userEmails.filter(
          (email) => !users.find((u) => u.email === email)
        ),
      };
    }),

  // Generate a shareable link
  generateShareLink: protectedProcedure
    .input(
      z.object({
        promptId: z.string(),
        permission: z.enum(["view", "edit"]),
        expiresInDays: z.number().min(1).max(365).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the prompt
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.promptId },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      if (prompt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to share this prompt",
        });
      }

      // Calculate expiration date
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      // Create share link
      const share = await ctx.prisma.promptShare.create({
        data: {
          promptId: input.promptId,
          sharedById: ctx.session.user.id,
          sharedWithId: null, // Link shares don't have specific user
          permission: input.permission,
          expiresAt,
        },
      });

      // Update prompt privacy to 'shared'
      if (prompt.privacy === "private") {
        await ctx.prisma.prompt.update({
          where: { id: input.promptId },
          data: { privacy: "shared" },
        });
      }

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "created_share_link",
          entityType: "prompt",
          entityId: input.promptId,
          metadata: {
            shareToken: share.shareToken,
            permission: input.permission,
            expiresAt: expiresAt?.toISOString(),
          },
        },
      });

      // Use NEXT_PUBLIC_APP_URL if available, otherwise fall back to NEXTAUTH_URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

      return {
        shareToken: share.shareToken,
        shareUrl: `${baseUrl}/shared/${share.shareToken}`,
        expiresAt,
      };
    }),

  // Get all shares for a prompt
  getPromptShares: protectedProcedure
    .input(z.object({ promptId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the prompt
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.promptId },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      if (prompt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view shares for this prompt",
        });
      }

      const shares = await ctx.prisma.promptShare.findMany({
        where: { promptId: input.promptId },
        include: {
          sharedWith: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Use NEXT_PUBLIC_APP_URL if available, otherwise fall back to NEXTAUTH_URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

      return shares.map((share) => ({
        id: share.id,
        permission: share.permission,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        isLinkShare: share.sharedWithId === null,
        shareToken: share.sharedWithId === null ? share.shareToken : null,
        shareUrl:
          share.sharedWithId === null
            ? `${baseUrl}/shared/${share.shareToken}`
            : null,
        sharedWith: share.sharedWith,
      }));
    }),

  // Get count of prompts shared with me
  getSharedWithMeCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.promptShare.count({
      where: {
        sharedWithId: ctx.session.user.id,
        prompt: {
          isDeleted: false,
        },
      },
    });

    return count;
  }),

  // Get prompts shared with me
  getSharedWithMe: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        sharedWithId: ctx.session.user.id,
        prompt: {
          isDeleted: false,
          ...(input.search && {
            OR: [
              { title: { contains: input.search, mode: "insensitive" as const } },
              { description: { contains: input.search, mode: "insensitive" as const } },
              { content: { contains: input.search, mode: "insensitive" as const } },
            ],
          }),
        },
      };

      const shares = await ctx.prisma.promptShare.findMany({
        where,
        include: {
          prompt: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              folder: true,
              tags: {
                include: {
                  tag: true,
                },
              },
              _count: {
                select: {
                  comments: true,
                },
              },
            },
          },
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined = undefined;
      if (shares.length > input.limit) {
        const nextItem = shares.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: shares.map((share) => ({
          ...share.prompt,
          tags: share.prompt.tags.map((pt) => pt.tag),
          permission: share.permission,
          sharedAt: share.createdAt,
        })),
        nextCursor,
      };
    }),

  // Revoke a share
  revokeShare: protectedProcedure
    .input(z.object({ shareId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const share = await ctx.prisma.promptShare.findUnique({
        where: { id: input.shareId },
        include: { prompt: true },
      });

      if (!share) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Share not found",
        });
      }

      // Only the person who shared or the prompt owner can revoke
      if (
        share.sharedById !== ctx.session.user.id &&
        share.prompt.userId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to revoke this share",
        });
      }

      await ctx.prisma.promptShare.delete({
        where: { id: input.shareId },
      });

      // Check if there are any remaining shares for this prompt
      const remainingShares = await ctx.prisma.promptShare.count({
        where: { promptId: share.promptId },
      });

      // If no more shares and prompt is 'shared', change to 'private'
      if (remainingShares === 0 && share.prompt.privacy === "shared") {
        await ctx.prisma.prompt.update({
          where: { id: share.promptId },
          data: { privacy: "private" },
        });
      }

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "revoked_share",
          entityType: "prompt",
          entityId: share.promptId,
          metadata: {
            shareId: input.shareId,
            sharedWithId: share.sharedWithId,
          },
        },
      });

      return { success: true };
    }),

  // Update share permission
  updatePermission: protectedProcedure
    .input(
      z.object({
        shareId: z.string(),
        permission: z.enum(["view", "edit", "admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const share = await ctx.prisma.promptShare.findUnique({
        where: { id: input.shareId },
        include: { prompt: true },
      });

      if (!share) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Share not found",
        });
      }

      // Only the prompt owner can update permissions
      if (share.prompt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this share",
        });
      }

      const updated = await ctx.prisma.promptShare.update({
        where: { id: input.shareId },
        data: { permission: input.permission },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "updated_share_permission",
          entityType: "prompt",
          entityId: share.promptId,
          metadata: {
            shareId: input.shareId,
            oldPermission: share.permission,
            newPermission: input.permission,
          },
        },
      });

      return updated;
    }),

  // Get a prompt by share token (public access)
  getByShareToken: protectedProcedure
    .input(z.object({ shareToken: z.string() }))
    .query(async ({ ctx, input }) => {
      const share = await ctx.prisma.promptShare.findUnique({
        where: { shareToken: input.shareToken },
        include: {
          prompt: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              tags: {
                include: {
                  tag: true,
                },
              },
              _count: {
                select: {
                  comments: true,
                },
              },
            },
          },
        },
      });

      if (!share) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Share link not found or expired",
        });
      }

      // Check if expired
      if (share.expiresAt && share.expiresAt < new Date()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This share link has expired",
        });
      }

      // Check if prompt is deleted
      if (share.prompt.isDeleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This prompt is no longer available",
        });
      }

      return {
        ...share.prompt,
        tags: share.prompt.tags.map((pt) => pt.tag),
        permission: share.permission,
        sharedAt: share.createdAt,
        expiresAt: share.expiresAt,
      };
    }),

  // Make a prompt public
  makePublic: protectedProcedure
    .input(z.object({ promptId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.promptId },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      if (prompt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to make this prompt public",
        });
      }

      const updated = await ctx.prisma.prompt.update({
        where: { id: input.promptId },
        data: { privacy: "public" },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "made_public",
          entityType: "prompt",
          entityId: input.promptId,
        },
      });

      return updated;
    }),

  // Make a prompt visible to registered users only
  makeRegistered: protectedProcedure
    .input(z.object({ promptId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.promptId },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      if (prompt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to change this prompt's privacy",
        });
      }

      const updated = await ctx.prisma.prompt.update({
        where: { id: input.promptId },
        data: { privacy: "registered" },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "made_registered",
          entityType: "prompt",
          entityId: input.promptId,
        },
      });

      return updated;
    }),

  // Make a prompt private
  makePrivate: protectedProcedure
    .input(z.object({ promptId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.promptId },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      if (prompt.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to change this prompt's privacy",
        });
      }

      // Remove all shares when making private
      await ctx.prisma.promptShare.deleteMany({
        where: { promptId: input.promptId },
      });

      const updated = await ctx.prisma.prompt.update({
        where: { id: input.promptId },
        data: { privacy: "private" },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "made_private",
          entityType: "prompt",
          entityId: input.promptId,
        },
      });

      return updated;
    }),
});
