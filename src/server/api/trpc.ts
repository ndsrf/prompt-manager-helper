import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';
import { validateExtensionToken } from '@/lib/extension-auth';
import { checkAPIRateLimit } from '@/lib/rate-limit';
import { getClientIdentifier, getRateLimitTier } from '@/lib/api-rate-limit';

export const createTRPCContext = async (opts: { headers: Headers; session: Session | null }) => {
  // Check for extension token in Authorization header
  const authHeader = opts.headers.get('authorization');
  let user = opts.session?.user;

  if (!user && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const extensionUser = await validateExtensionToken(token);

    if (extensionUser) {
      user = {
        id: extensionUser.id,
        email: extensionUser.email,
        name: extensionUser.name,
      };
    }
  }

  // Create request-like object for rate limiting
  const req = {
    headers: opts.headers,
  } as Request;

  return {
    session: user ? { user } as Session : null,
    prisma,
    headers: opts.headers,
    req,
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

/**
 * Rate limiting middleware for public procedures
 * Uses anonymous tier limits (20 req/min)
 */
const enforceRateLimit = t.middleware(async ({ ctx, next }) => {
  const identifier = getClientIdentifier(ctx.req, ctx.session?.user?.id);
  const tier = ctx.session?.user ? getRateLimitTier('FREE') : getRateLimitTier();

  const result = await checkAPIRateLimit(identifier, tier.limit, tier.window);

  if (!result.success) {
    const minutesUntilReset = Math.ceil((result.reset * 1000 - Date.now()) / 60000);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Please try again in ${minutesUntilReset} minute${minutesUntilReset > 1 ? 's' : ''}.`,
    });
  }

  return next();
});

/**
 * Public procedure with rate limiting
 */
export const publicProcedure = t.procedure.use(enforceRateLimit);

/**
 * Authentication middleware
 */
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

/**
 * Protected procedure with authentication and rate limiting
 */
export const protectedProcedure = t.procedure.use(enforceRateLimit).use(enforceUserIsAuthed);
