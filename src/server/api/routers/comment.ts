import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const commentRouter = createTRPCRouter({
  // Get all comments for a prompt
  getByPromptId: protectedProcedure
    .input(
      z.object({
        promptId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user has access to the prompt
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.promptId },
        include: {
          shares: {
            where: {
              OR: [
                { sharedWithId: ctx.session.user.id },
                { sharedById: ctx.session.user.id },
              ],
            },
          },
        },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      // User must own the prompt, have it shared with them, or it must be public
      const hasAccess =
        prompt.userId === ctx.session.user.id ||
        prompt.shares.length > 0 ||
        prompt.privacy === "public";

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view comments for this prompt",
        });
      }

      const comments = await ctx.prisma.comment.findMany({
        where: {
          promptId: input.promptId,
          parentId: null, // Only get top-level comments
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined = undefined;
      if (comments.length > input.limit) {
        const nextItem = comments.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: comments,
        nextCursor,
      };
    }),

  // Create a new comment
  create: protectedProcedure
    .input(
      z.object({
        promptId: z.string(),
        content: z.string().min(1).max(5000),
        parentId: z.string().optional(),
        mentions: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has access to the prompt
      const prompt = await ctx.prisma.prompt.findUnique({
        where: { id: input.promptId },
        include: {
          shares: {
            where: {
              OR: [
                { sharedWithId: ctx.session.user.id },
                { sharedById: ctx.session.user.id },
              ],
            },
          },
        },
      });

      if (!prompt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prompt not found",
        });
      }

      // User must own the prompt, have it shared with them, or it must be public
      const hasAccess =
        prompt.userId === ctx.session.user.id ||
        prompt.shares.length > 0 ||
        prompt.privacy === "public";

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to comment on this prompt",
        });
      }

      // If this is a reply, verify the parent comment exists
      if (input.parentId) {
        const parentComment = await ctx.prisma.comment.findUnique({
          where: { id: input.parentId },
        });

        if (!parentComment || parentComment.promptId !== input.promptId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent comment not found",
          });
        }
      }

      // Create the comment
      const comment = await ctx.prisma.comment.create({
        data: {
          promptId: input.promptId,
          userId: ctx.session.user.id,
          content: input.content,
          parentId: input.parentId,
          mentions: input.mentions ?? [],
        },
        include: {
          user: {
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
          userId: ctx.session.user.id,
          action: input.parentId ? "replied_to_comment" : "commented",
          entityType: "prompt",
          entityId: input.promptId,
          metadata: {
            commentId: comment.id,
            parentId: input.parentId,
            mentions: input.mentions,
          },
        },
      });

      // TODO: Create notifications for mentions
      // This would be implemented in a notification system

      return comment;
    }),

  // Update a comment
  update: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        content: z.string().min(1).max(5000),
        mentions: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Only the comment author can update it
      if (comment.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this comment",
        });
      }

      const updated = await ctx.prisma.comment.update({
        where: { id: input.commentId },
        data: {
          content: input.content,
          mentions: input.mentions ?? [],
          updatedAt: new Date(),
        },
        include: {
          user: {
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
          userId: ctx.session.user.id,
          action: "updated_comment",
          entityType: "comment",
          entityId: input.commentId,
        },
      });

      return updated;
    }),

  // Delete a comment
  delete: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        include: {
          prompt: true,
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Only the comment author or prompt owner can delete
      if (
        comment.userId !== ctx.session.user.id &&
        comment.prompt.userId !== ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this comment",
        });
      }

      // Delete the comment and its replies (cascade)
      await ctx.prisma.comment.delete({
        where: { id: input.commentId },
      });

      // Log activity
      await ctx.prisma.activityLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "deleted_comment",
          entityType: "comment",
          entityId: input.commentId,
          metadata: {
            promptId: comment.promptId,
          },
        },
      });

      return { success: true };
    }),

  // Get comment count for a prompt
  getCount: protectedProcedure
    .input(z.object({ promptId: z.string() }))
    .query(async ({ ctx, input }) => {
      const count = await ctx.prisma.comment.count({
        where: { promptId: input.promptId },
      });

      return { count };
    }),
});
