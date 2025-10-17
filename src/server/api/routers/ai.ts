import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { testPrompt, improvePrompt, analyzePrompt } from '@/lib/ai-service';

export const aiRouter = createTRPCRouter({
  /**
   * Test a prompt with a specific LLM
   */
  testPrompt: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        llm: z.enum(['chatgpt', 'claude', 'gemini']),
        maxTokens: z.number().min(100).max(4000).optional().default(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      try {
        const result = await testPrompt({
          content: input.content,
          llm: input.llm,
          maxTokens: input.maxTokens,
        });

        // Log the test for analytics
        await ctx.prisma.activityLog.create({
          data: {
            userId,
            action: 'tested_prompt',
            entityType: 'prompt',
            entityId: userId, // Using userId as placeholder since we don't have promptId
            metadata: {
              llm: input.llm,
              contentLength: input.content.length,
            },
          },
        });

        return result;
      } catch (error: any) {
        throw new Error(`Test failed: ${error.message}`);
      }
    }),

  /**
   * Improve a prompt using AI
   */
  improvePrompt: protectedProcedure
    .input(
      z.object({
        promptId: z.string().uuid().optional(),
        content: z.string().min(1),
        targetLlm: z.string().optional(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Check user tier and usage limits
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // For free tier, check monthly AI improvement usage
      if (user.subscriptionTier === 'free') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const usageCount = await ctx.prisma.activityLog.count({
          where: {
            userId,
            action: 'improved_prompt',
            createdAt: {
              gte: startOfMonth,
            },
          },
        });

        if (usageCount >= 5) {
          throw new Error(
            'Monthly AI improvement limit reached. Upgrade to Pro for unlimited improvements.'
          );
        }
      }

      try {
        const result = await improvePrompt({
          content: input.content,
          targetLlm: input.targetLlm,
          context: input.context,
        });

        // Log the improvement
        await ctx.prisma.activityLog.create({
          data: {
            userId,
            action: 'improved_prompt',
            entityType: 'prompt',
            entityId: input.promptId || userId,
            metadata: {
              targetLlm: input.targetLlm,
              score: result.score,
              changesCount: result.changes.length,
            },
          },
        });

        return result;
      } catch (error: any) {
        throw new Error(`Improvement failed: ${error.message}`);
      }
    }),

  /**
   * Analyze a prompt for issues and strengths
   */
  analyzePrompt: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const result = await analyzePrompt(input.content);
        return result;
      } catch (error: any) {
        throw new Error(`Analysis failed: ${error.message}`);
      }
    }),

  /**
   * Get AI improvement usage stats for current user
   */
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // For free tier, get monthly usage
    if (user.subscriptionTier === 'free') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const usageCount = await ctx.prisma.activityLog.count({
        where: {
          userId,
          action: 'improved_prompt',
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      return {
        tier: 'free',
        used: usageCount,
        limit: 5,
        remaining: Math.max(0, 5 - usageCount),
        unlimited: false,
      };
    }

    // Pro and Enterprise have unlimited
    return {
      tier: user.subscriptionTier,
      used: null,
      limit: null,
      remaining: null,
      unlimited: true,
    };
  }),
});
