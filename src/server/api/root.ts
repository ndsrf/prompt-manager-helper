import { createTRPCRouter } from './trpc';
import { userRouter } from './routers/user';
import { folderRouter } from './routers/folder';
import { tagRouter } from './routers/tag';
import { promptRouter } from './routers/prompt';
import { aiRouter } from './routers/ai';
import { templateRouter } from './routers/template';

export const appRouter = createTRPCRouter({
  user: userRouter,
  folder: folderRouter,
  tag: tagRouter,
  prompt: promptRouter,
  ai: aiRouter,
  template: templateRouter,
});

export type AppRouter = typeof appRouter;
