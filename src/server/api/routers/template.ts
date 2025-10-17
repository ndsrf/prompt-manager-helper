import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

export const templateRouter = createTRPCRouter({
  /**
   * Get all public prompt templates
   */
  getAll: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).optional().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        isPublic: true,
      };

      if (input?.category) {
        where.category = input.category;
      }

      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      const templates = await ctx.prisma.promptTemplate.findMany({
        where,
        orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
        take: input?.limit || 20,
      });

      return templates;
    }),

  /**
   * Get template categories
   */
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.promptTemplate.groupBy({
      by: ['category'],
      where: {
        isPublic: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        category: 'asc',
      },
    });

    return categories.map((cat) => ({
      name: cat.category,
      count: cat._count.id,
    }));
  }),

  /**
   * Get a specific template by ID
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.promptTemplate.findUnique({
        where: { id: input.id },
      });

      if (!template || !template.isPublic) {
        throw new Error('Template not found');
      }

      // Increment usage count
      await ctx.prisma.promptTemplate.update({
        where: { id: input.id },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });

      return template;
    }),

  /**
   * Create a new prompt from a template
   */
  createFromTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        folderId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get the template
      const template = await ctx.prisma.promptTemplate.findUnique({
        where: { id: input.templateId },
      });

      if (!template || !template.isPublic) {
        throw new Error('Template not found');
      }

      // Create a new prompt from the template
      const prompt = await ctx.prisma.prompt.create({
        data: {
          userId,
          title: input.title || template.name,
          description: template.description,
          content: template.content,
          variables: template.variables as any,
          targetLlm: template.targetLlm,
          folderId: input.folderId,
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          folder: true,
        },
      });

      // Log the activity
      await ctx.prisma.activityLog.create({
        data: {
          userId,
          action: 'created_from_template',
          entityType: 'prompt',
          entityId: prompt.id,
          metadata: {
            templateId: template.id,
            templateName: template.name,
          },
        },
      });

      return prompt;
    }),

  /**
   * Get popular templates
   */
  getPopular: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(20).optional().default(10),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const templates = await ctx.prisma.promptTemplate.findMany({
        where: {
          isPublic: true,
        },
        orderBy: {
          usageCount: 'desc',
        },
        take: input?.limit || 10,
      });

      return templates;
    }),
});
