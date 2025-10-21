'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signOut } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import { Library, Globe } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Fetch dashboard stats
  const { data: promptStats } = trpc.prompt.getStats.useQuery(undefined, {
    enabled: status === 'authenticated',
  });
  const { data: folders } = trpc.folder.getAll.useQuery(undefined, {
    enabled: status === 'authenticated',
  });
  const { data: tags } = trpc.tag.getAll.useQuery(undefined, {
    enabled: status === 'authenticated',
  });
  const { data: sharedCount } = trpc.share.getSharedWithMeCount.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const totalPrompts = promptStats?.total ?? 0;
  const totalFolders = folders?.length ?? 0;
  const totalTags = tags?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-bold">PromptEasy</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={() => router.push('/library')}
              className="w-full sm:w-auto justify-start sm:justify-center"
            >
              <Library className="h-4 w-4 mr-2" />
              Library
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/gallery')}
              className="w-full sm:w-auto justify-start sm:justify-center"
            >
              <Globe className="h-4 w-4 mr-2" />
              Gallery
            </Button>
            <span className="text-sm text-muted-foreground truncate max-w-full sm:max-w-xs">
              {session.user.email}
            </span>
            <Button variant="outline" onClick={() => signOut()} className="w-full sm:w-auto">
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Welcome, {session.user.name || session.user.email}!
          </h2>
          <p className="text-muted-foreground mt-2">
            Your prompt management dashboard
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => router.push('/library')}
          >
            <CardHeader>
              <CardTitle>Prompts</CardTitle>
              <CardDescription>Manage your prompt library</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalPrompts}</p>
              <p className="text-sm text-muted-foreground">Total prompts</p>
              {sharedCount !== undefined && sharedCount > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {sharedCount} shared with me
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle>Folders</CardTitle>
              <CardDescription>Organize your prompts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalFolders}</p>
              <p className="text-sm text-muted-foreground">Total folders</p>
            </CardContent>
          </Card>

          <Card className="hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Categorize your prompts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalTags}</p>
              <p className="text-sm text-muted-foreground">Total tags</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 sm:mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Start building your prompt library
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1">
                  <p className="font-medium">Create your first prompt</p>
                  <p className="text-sm text-muted-foreground">
                    Build and save reusable prompts
                  </p>
                </div>
                <Button onClick={() => router.push('/library/new')} className="w-full sm:w-auto">
                  Create Prompt
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1">
                  <p className="font-medium">View your library</p>
                  <p className="text-sm text-muted-foreground">
                    Browse and manage all your prompts
                  </p>
                </div>
                <Button variant="outline" onClick={() => router.push('/library')} className="w-full sm:w-auto">
                  Go to Library
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1">
                  <p className="font-medium">Install Chrome Extension</p>
                  <p className="text-sm text-muted-foreground">
                    Use prompts directly in LLM interfaces
                  </p>
                </div>
                <Button variant="outline" disabled className="w-full sm:w-auto">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
