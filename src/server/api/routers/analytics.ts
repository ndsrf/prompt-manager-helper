import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const analyticsRouter = createTRPCRouter({
  // Get overall usage statistics
  getUsageStats: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
      const endDate = input.endDate ? new Date(input.endDate) : new Date();

      // Get total prompt count
      const totalPrompts = await ctx.prisma.prompt.count({
        where: {
          userId,
          isDeleted: false,
        },
      });

      // Get total usage count
      const totalUsage = await ctx.prisma.promptUsage.count({
        where: {
          userId,
          usedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Get success rate
      const usageWithSuccess = await ctx.prisma.promptUsage.findMany({
        where: {
          userId,
          usedAt: {
            gte: startDate,
            lte: endDate,
          },
          success: {
            not: null,
          },
        },
        select: {
          success: true,
        },
      });

      const successCount = usageWithSuccess.filter((u) => u.success).length;
      const successRate = usageWithSuccess.length > 0
        ? (successCount / usageWithSuccess.length) * 100
        : 0;

      // Get total folders
      const totalFolders = await ctx.prisma.folder.count({
        where: {
          userId,
        },
      });

      // Get total tags
      const totalTags = await ctx.prisma.tag.count({
        where: {
          userId,
        },
      });

      // Get favorite prompts count
      const favoritePrompts = await ctx.prisma.prompt.count({
        where: {
          userId,
          isFavorite: true,
          isDeleted: false,
        },
      });

      return {
        totalPrompts,
        totalUsage,
        successRate: Math.round(successRate * 10) / 10,
        totalFolders,
        totalTags,
        favoritePrompts,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      };
    }),

  // Get most used prompts
  getMostUsedPrompts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate ? new Date(input.endDate) : new Date();

      // Get usage counts per prompt
      const usageCounts = await ctx.prisma.promptUsage.groupBy({
        by: ['promptId'],
        where: {
          userId,
          usedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: input.limit,
      });

      // Get prompt details
      const promptIds = usageCounts.map((u) => u.promptId);
      const prompts = await ctx.prisma.prompt.findMany({
        where: {
          id: {
            in: promptIds,
          },
          userId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          targetLlm: true,
          usageCount: true,
          createdAt: true,
        },
      });

      // Merge usage counts with prompt details
      const result = usageCounts.map((usage) => {
        const prompt = prompts.find((p) => p.id === usage.promptId);
        return {
          promptId: usage.promptId,
          usageCount: usage._count.id,
          prompt,
        };
      });

      return result;
    }),

  // Get usage timeline (daily usage over time)
  getUsageTimeline: protectedProcedure
    .input(
      z.object({
        days: z.number().min(7).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const startDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      // Get all usage records
      const usageRecords = await ctx.prisma.promptUsage.findMany({
        where: {
          userId,
          usedAt: {
            gte: startDate,
          },
        },
        select: {
          usedAt: true,
          success: true,
        },
        orderBy: {
          usedAt: 'asc',
        },
      });

      // Group by date
      const dailyUsage: Record<string, { date: string; count: number; successCount: number }> = {};

      usageRecords.forEach((record) => {
        const date = record.usedAt.toISOString().split('T')[0];
        if (!dailyUsage[date]) {
          dailyUsage[date] = { date, count: 0, successCount: 0 };
        }
        dailyUsage[date].count++;
        if (record.success) {
          dailyUsage[date].successCount++;
        }
      });

      // Fill in missing dates with 0
      const result = [];
      for (let i = 0; i < input.days; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        result.unshift(
          dailyUsage[dateStr] || {
            date: dateStr,
            count: 0,
            successCount: 0,
          }
        );
      }

      return result;
    }),

  // Get usage by LLM type
  getUsageByLlm: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate ? new Date(input.endDate) : new Date();

      const usageByLlm = await ctx.prisma.promptUsage.groupBy({
        by: ['llmUsed'],
        where: {
          userId,
          usedAt: {
            gte: startDate,
            lte: endDate,
          },
          llmUsed: {
            not: null,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      return usageByLlm.map((item) => ({
        llm: item.llmUsed || 'Unknown',
        count: item._count.id,
      }));
    }),

  // Get recent activity
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const activities = await ctx.prisma.activityLog.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          createdAt: true,
        },
      });

      return activities;
    }),

  // Record prompt usage
  recordUsage: protectedProcedure
    .input(
      z.object({
        promptId: z.string().uuid(),
        llmUsed: z.string().optional(),
        success: z.boolean().optional(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify prompt belongs to user
      const prompt = await ctx.prisma.prompt.findFirst({
        where: {
          id: input.promptId,
          userId,
        },
      });

      if (!prompt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prompt not found',
        });
      }

      // Create usage record
      const usage = await ctx.prisma.promptUsage.create({
        data: {
          promptId: input.promptId,
          userId,
          llmUsed: input.llmUsed,
          success: input.success,
          context: input.context,
        },
      });

      // Update prompt usage count
      await ctx.prisma.prompt.update({
        where: {
          id: input.promptId,
        },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });

      return usage;
    }),

  // Update usage success status
  updateUsageSuccess: protectedProcedure
    .input(
      z.object({
        usageId: z.string().uuid(),
        success: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify usage belongs to user
      const usage = await ctx.prisma.promptUsage.findFirst({
        where: {
          id: input.usageId,
          userId,
        },
      });

      if (!usage) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usage record not found',
        });
      }

      // Update success status
      const updatedUsage = await ctx.prisma.promptUsage.update({
        where: {
          id: input.usageId,
        },
        data: {
          success: input.success,
        },
      });

      return updatedUsage;
    }),

  // Get success rate by prompt
  getPromptSuccessRates: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate ? new Date(input.endDate) : new Date();

      // Get all usage with success tracking
      const usageRecords = await ctx.prisma.promptUsage.findMany({
        where: {
          userId,
          usedAt: {
            gte: startDate,
            lte: endDate,
          },
          success: {
            not: null,
          },
        },
        select: {
          promptId: true,
          success: true,
          prompt: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
      });

      // Calculate success rate per prompt
      const promptStats: Record<
        string,
        {
          promptId: string;
          title: string;
          description: string | null;
          totalUsage: number;
          successCount: number;
          successRate: number;
        }
      > = {};

      usageRecords.forEach((record) => {
        if (!promptStats[record.promptId]) {
          promptStats[record.promptId] = {
            promptId: record.promptId,
            title: record.prompt.title,
            description: record.prompt.description,
            totalUsage: 0,
            successCount: 0,
            successRate: 0,
          };
        }
        promptStats[record.promptId].totalUsage++;
        if (record.success) {
          promptStats[record.promptId].successCount++;
        }
      });

      // Calculate success rates and sort
      const result = Object.values(promptStats)
        .map((stat) => ({
          ...stat,
          successRate: Math.round((stat.successCount / stat.totalUsage) * 100 * 10) / 10,
        }))
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, input.limit);

      return result;
    }),
});
