import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';

export const userRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log('Register mutation input:', input);

      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
          provider: 'email',
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      return user;
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        createdAt: true,
        settings: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        avatarUrl: z.string().url().optional(),
        settings: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          settings: true,
        },
      });

      return user;
    }),
});
