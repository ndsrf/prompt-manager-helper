import { createTRPCRouter } from './trpc';
import { userRouter } from './routers/user';
import { folderRouter } from './routers/folder';
import { tagRouter } from './routers/tag';
import { promptRouter } from './routers/prompt';

export const appRouter = createTRPCRouter({
  user: userRouter,
  folder: folderRouter,
  tag: tagRouter,
  prompt: promptRouter,
});

export type AppRouter = typeof appRouter;
