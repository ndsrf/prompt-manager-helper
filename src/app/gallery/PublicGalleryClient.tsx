"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Globe,
  Search,
  MessageSquare,
  ExternalLink,
  TrendingUp,
  Clock,
  Star,
  Copy,
  Home,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";

export function PublicGalleryClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [targetLlm, setTargetLlm] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"updatedAt" | "createdAt" | "usageCount">("updatedAt");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
  // @ts-ignore - Type inference issue with tRPC infinite query
    trpc.prompt.getPublic.useInfiniteQuery(
      {
        limit: 12,
        search: searchQuery || undefined,
        targetLlm: targetLlm !== "all" ? targetLlm : undefined,
        sortBy,
        sortOrder: "desc",
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const prompts = data?.pages.flatMap((page) => page.items) ?? [];

  const handleCopyPrompt = (content: string, title: string) => {
    void navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: `"${title}" has been copied`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />

      <div className="relative z-10 container mx-auto py-8 sm:py-12 px-4 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              title="Back to Dashboard"
              className="hover:bg-white/10 text-white"
            >
              <Home className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
                  <Globe className="h-6 w-6 sm:h-7 sm:h-7 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                  Public Gallery
                </h1>
              </div>
              <p className="text-gray-400 text-sm sm:text-base ml-0 sm:ml-14">
                Discover and use prompts shared by the community
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
            <Input
              type="text"
              placeholder="Search public prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2">
            <Select value={targetLlm} onValueChange={setTargetLlm}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All LLMs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LLMs</SelectItem>
                <SelectItem value="chatgpt">ChatGPT</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recently Updated
                  </div>
                </SelectItem>
                <SelectItem value="createdAt">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recently Created
                  </div>
                </SelectItem>
                <SelectItem value="usageCount">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Most Used
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        {!isLoading && prompts.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-purple-300">
            <Sparkles className="h-4 w-4" />
            <span>Showing {prompts.length} public {prompts.length === 1 ? "prompt" : "prompts"}</span>
          </div>
        )}

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 bg-white/10" />
                  <Skeleton className="h-4 w-full bg-white/10" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full bg-white/10" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <Card className="border-dashed bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-4">
                <Globe className="h-16 w-16 text-purple-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">No public prompts found</h3>
              <p className="mt-2 text-sm text-gray-400 text-center max-w-sm">
                {searchQuery
                  ? "No prompts match your search. Try different keywords."
                  : "There are no public prompts yet. Be the first to share your prompts with the community!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {prompts.map((prompt) => (
                <Card key={prompt.id} className="group bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2 flex-1 text-white">
                        {prompt.title}
                      </CardTitle>
                      {prompt.usageCount > 0 && (
                        <Badge className="gap-1 shrink-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {prompt.usageCount}
                        </Badge>
                      )}
                    </div>
                    {prompt.description && (
                      <CardDescription className="line-clamp-2 text-gray-400">
                        {prompt.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Content Preview */}
                    <div className="rounded-lg bg-black/20 border border-white/5 p-3">
                      <p className="text-xs font-mono text-gray-300 line-clamp-3">
                        {prompt.content}
                      </p>
                    </div>

                    {/* Tags */}
                    {prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {prompt.tags.slice(0, 3).map((tag: any) => (
                          <Badge key={tag.id} className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30">
                            {tag.name}
                          </Badge>
                        ))}
                        {prompt.tags.length > 3 && (
                          <Badge className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                            +{prompt.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        {prompt.user.avatarUrl ? (
                          <div className="relative h-5 w-5 rounded-full overflow-hidden border border-purple-500/30">
                            <Image
                              src={prompt.user.avatarUrl}
                              alt={prompt.user.name ?? prompt.user.email}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-[10px] font-medium text-white">
                            {prompt.user.name?.[0]?.toUpperCase() ?? prompt.user.email?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <span className="truncate max-w-[120px] text-gray-300">
                          {prompt.user.name ?? prompt.user.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {prompt.targetLlm && (
                          <Badge className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {prompt.targetLlm}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-gray-400">
                          <MessageSquare className="h-3 w-3" />
                          <span>{prompt._count?.comments ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Updated {formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: true })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/editor/${prompt.id}`} className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0" size="sm">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="bg-white/5 hover:bg-white/10 text-white border-white/10"
                        onClick={() => handleCopyPrompt(prompt.content, prompt.title)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 px-8"
                  size="lg"
                >
                  {isFetchingNextPage ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
