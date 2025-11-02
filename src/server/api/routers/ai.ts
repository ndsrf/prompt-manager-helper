import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  testPrompt,
  improvePrompt,
  analyzePrompt,
  comparePrompts,
  generateVariations,
  suggestVariables,
} from '@/lib/ai-service';

export const aiRouter = createTRPCRouter({
  /**
   * Test a prompt with a specific LLM
   */
  testPrompt: protectedProcedure
    .input(
      z.object({
        promptId: z.string().uuid().optional(),
        content: z.string().min(1),
        llm: z.enum(['chatgpt', 'claude', 'gemini']),
        maxTokens: z.number().min(100).max(4000).optional().default(1000),
        applyCustomInstructions: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      try {
        let finalContent = input.content;

        // If applyCustomInstructions is true, prepend user's custom instructions
        if (input.applyCustomInstructions) {
          const user = await ctx.prisma.user.findUnique({
            where: { id: userId },
            select: { customInstructions: true },
          });

          if (user?.customInstructions) {
            finalContent = `${user.customInstructions}\n\n${input.content}`;
          }
        }

        const result = await testPrompt({
          content: finalContent,
          llm: input.llm,
          maxTokens: input.maxTokens,
        });

        // Log the test for analytics
        await ctx.prisma.activityLog.create({
          data: {
            userId,
            action: 'tested_prompt',
            entityType: 'prompt',
            entityId: input.promptId || userId,
            metadata: {
              llm: input.llm,
              contentLength: input.content.length,
              appliedCustomInstructions: input.applyCustomInstructions,
            },
          },
        });

        // Track usage if promptId is provided
        if (input.promptId) {
          await ctx.prisma.promptUsage.create({
            data: {
              promptId: input.promptId,
              userId,
              llmUsed: input.llm,
              context: 'tested_with_ai',
            },
          });

          // Increment usage count
          await ctx.prisma.prompt.update({
            where: { id: input.promptId },
            data: {
              usageCount: {
                increment: 1,
              },
            },
          });
        }

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
        framework: z.enum(['default', 'raptor', 'react']).optional().default('default'),
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
          framework: input.framework,
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
              framework: input.framework,
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

  /**
   * Compare two prompts and explain differences
   */
  comparePrompts: protectedProcedure
    .input(
      z.object({
        original: z.string().min(1),
        improved: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await comparePrompts(input.original, input.improved);
        return result;
      } catch (error: any) {
        throw new Error(`Comparison failed: ${error.message}`);
      }
    }),

  /**
   * Generate prompt variations for A/B testing
   */
  generateVariations: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        targetLlm: z.string().optional(),
        count: z.number().min(1).max(5).optional().default(3),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Check user tier for this feature
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Variations feature only for Pro and Enterprise
      if (user.subscriptionTier === 'free') {
        throw new Error(
          'Variation generation is only available for Pro and Enterprise users. Please upgrade to access this feature.'
        );
      }

      try {
        const result = await generateVariations(
          input.content,
          input.targetLlm,
          input.count
        );

        // Log the activity
        await ctx.prisma.activityLog.create({
          data: {
            userId,
            action: 'generated_variations',
            entityType: 'prompt',
            entityId: userId,
            metadata: {
              targetLlm: input.targetLlm,
              variationCount: result.length,
            },
          },
        });

        return result;
      } catch (error: any) {
        throw new Error(`Variation generation failed: ${error.message}`);
      }
    }),

  /**
   * Suggest variables for a prompt
   */
  suggestVariables: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await suggestVariables(input.content);
        return result;
      } catch (error: any) {
        throw new Error(`Variable suggestion failed: ${error.message}`);
      }
    }),
});
