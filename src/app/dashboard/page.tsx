'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signOut } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import { Library, Globe, User, LogOut, Sparkles, Folder, Tags, Share2, Plus, ArrowRight, BarChart3 } from 'lucide-react';
import Link from 'next/link';

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
  const { data: user } = trpc.user.me.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            PromptEasy
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={() => router.push('/library')}
              className="w-full sm:w-auto justify-start sm:justify-center text-white hover:bg-white/10"
            >
              <Library className="h-4 w-4 mr-2" />
              Library
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/gallery')}
              className="w-full sm:w-auto justify-start sm:justify-center text-white hover:bg-white/10"
            >
              <Globe className="h-4 w-4 mr-2" />
              Gallery
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/analytics')}
              className="w-full sm:w-auto justify-start sm:justify-center text-white hover:bg-white/10"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Link href="/profile" className="w-full sm:w-auto">
              <Button
                variant="ghost"
                className="w-full sm:w-auto justify-start sm:justify-center text-white hover:bg-white/10"
              >
                {user?.avatarUrl ? (
                  <div className="relative h-4 w-4 rounded-full overflow-hidden mr-2 border border-purple-500/50">
                    <Image
                      src={user.avatarUrl}
                      alt={session.user.name ?? session.user.email ?? 'User'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <User className="h-4 w-4 mr-2" />
                )}
                <span className="truncate max-w-[150px]">{session.user.name ?? session.user.email}</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="w-full sm:w-auto text-white hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto p-4 sm:py-8 space-y-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Welcome back, {session.user.name || session.user.email?.split('@')[0]}!
              </h2>
              <p className="text-gray-400 mt-1">
                Your prompt management dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            className="group cursor-pointer bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm border-purple-500/30 hover:border-purple-500/50 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20"
            onClick={() => router.push('/library')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Library className="h-5 w-5" />
                    Prompts
                  </CardTitle>
                  <CardDescription className="text-gray-400">Manage your prompt library</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-2">{totalPrompts}</p>
              <p className="text-sm text-purple-300">Total prompts</p>
              {sharedCount !== undefined && sharedCount > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Share2 className="h-4 w-4" />
                    <span>{sharedCount} shared with me</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm border-blue-500/30 hover:border-blue-500/50 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    Folders
                  </CardTitle>
                  <CardDescription className="text-gray-400">Organize your prompts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-2">{totalFolders}</p>
              <p className="text-sm text-blue-300">Total folders</p>
            </CardContent>
          </Card>

          <Card className="group bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-sm border-green-500/30 hover:border-green-500/50 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Tags className="h-5 w-5" />
                    Tags
                  </CardTitle>
                  <CardDescription className="text-gray-400">Categorize your prompts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-2">{totalTags}</p>
              <p className="text-sm text-green-300">Total tags</p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Section */}
        <div className="mt-6 sm:mt-8">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Getting Started</CardTitle>
                  <CardDescription className="text-gray-400">
                    Start building your prompt library
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="group p-4 rounded-xl bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 hover:border-purple-500/40 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex-1">
                    <p className="font-medium text-white flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create your first prompt
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Build and save reusable prompts
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/library/new')}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                  >
                    Create Prompt
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>

              <div className="group p-4 rounded-xl bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/20 hover:border-blue-500/40 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex-1">
                    <p className="font-medium text-white flex items-center gap-2">
                      <Library className="h-4 w-4" />
                      View your library
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Browse and manage all your prompts
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/library')}
                    className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border-white/10"
                  >
                    Go to Library
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>

              <div className="group p-4 rounded-xl bg-gradient-to-r from-gray-600/10 to-gray-500/10 border border-gray-500/20 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex-1">
                    <p className="font-medium text-white flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Install Chrome Extension
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Use prompts directly in LLM interfaces
                    </p>
                  </div>
                  <Button
                    disabled
                    className="w-full sm:w-auto bg-white/5 text-gray-500 border-white/5 cursor-not-allowed"
                  >
                    Coming Soon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
