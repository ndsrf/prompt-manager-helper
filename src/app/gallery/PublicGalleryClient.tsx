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
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
            title="Back to Dashboard"
          >
            <Home className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Public Gallery</h1>
          </div>
        </div>
        <p className="text-muted-foreground ml-14">
          Discover and use prompts shared by the community
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search public prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={targetLlm} onValueChange={setTargetLlm}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
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
        <div className="text-sm text-muted-foreground">
          Showing {prompts.length} public {prompts.length === 1 ? "prompt" : "prompts"}
        </div>
      )}

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Globe className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No public prompts found</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
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
              <Card key={prompt.id} className="hover:shadow-lg transition-shadow group">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2 flex-1">
                      {prompt.title}
                    </CardTitle>
                    {prompt.usageCount > 0 && (
                      <Badge variant="secondary" className="gap-1 shrink-0">
                        <Star className="h-3 w-3" />
                        {prompt.usageCount}
                      </Badge>
                    )}
                  </div>
                  {prompt.description && (
                    <CardDescription className="line-clamp-2">
                      {prompt.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Content Preview */}
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs font-mono text-muted-foreground line-clamp-3">
                      {prompt.content}
                    </p>
                  </div>

                  {/* Tags */}
                  {prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {prompt.tags.slice(0, 3).map((tag: any) => (
                        <Badge key={tag.id} variant="outline" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                      {prompt.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{prompt.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {prompt.user.avatarUrl ? (
                        <div className="relative h-5 w-5 rounded-full overflow-hidden border border-border">
                          <Image
                            src={prompt.user.avatarUrl}
                            alt={prompt.user.name ?? prompt.user.email}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium">
                          {prompt.user.name?.[0]?.toUpperCase() ?? prompt.user.email?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <span className="truncate max-w-[120px]">
                        {prompt.user.name ?? prompt.user.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {prompt.targetLlm && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                          {prompt.targetLlm}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{prompt._count?.comments ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: true })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/editor/${prompt.id}`} className="flex-1">
                      <Button className="w-full" size="sm" variant="outline">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
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
                variant="outline"
                size="lg"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
