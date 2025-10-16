import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

export const createTRPCContext = async (opts: { headers: Headers; session: Session | null }) => {
  return {
    session: opts.session,
    prisma,
    headers: opts.headers,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
