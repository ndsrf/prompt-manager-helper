'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signOut } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">PromptEasy</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <Button variant="outline" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            Welcome, {session.user.name || session.user.email}!
          </h2>
          <p className="text-muted-foreground mt-2">
            Your prompt management dashboard
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Prompts</CardTitle>
              <CardDescription>Manage your prompt library</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Total prompts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Folders</CardTitle>
              <CardDescription>Organize your prompts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Total folders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Categorize your prompts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Total tags</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Start building your prompt library
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Create your first prompt</p>
                  <p className="text-sm text-muted-foreground">
                    Build and save reusable prompts
                  </p>
                </div>
                <Button>Create Prompt</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Organize with folders</p>
                  <p className="text-sm text-muted-foreground">
                    Keep your prompts structured
                  </p>
                </div>
                <Button variant="outline">Create Folder</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Install Chrome Extension</p>
                  <p className="text-sm text-muted-foreground">
                    Use prompts directly in LLM interfaces
                  </p>
                </div>
                <Button variant="outline">Get Extension</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
