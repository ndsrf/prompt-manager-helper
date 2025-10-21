"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Search,
  Eye,
  Edit,
  Shield,
  MessageSquare,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SharedWithMeClientProps {
  userId: string;
}

export function SharedWithMeClient({ userId }: SharedWithMeClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
  // @ts-ignore - Type inference issue with tRPC infinite query
    trpc.share.getSharedWithMe.useInfiniteQuery(
      {
        limit: 20,
        search: searchQuery || undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const prompts = data?.pages.flatMap((page) => page.items) ?? [];

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case "view":
        return <Eye className="h-4 w-4" />;
      case "edit":
        return <Edit className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Link href="/dashboard">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Shared with Me</h1>
        </div>
        <p className="text-muted-foreground">
          Prompts that others have shared with you
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search shared prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No shared prompts</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery
                ? "No prompts match your search. Try different keywords."
                : "You don't have any prompts shared with you yet. When someone shares a prompt, it will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {prompts.map((prompt) => (
              <Card key={prompt.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">
                      {prompt.title}
                    </CardTitle>
                    <Badge variant="outline" className="gap-1 shrink-0">
                      {getPermissionIcon((prompt as any).permission)}
                      {(prompt as any).permission}
                    </Badge>
                  </div>
                  {prompt.description && (
                    <CardDescription className="line-clamp-2">
                      {prompt.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {prompt.content}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {prompt.tags.slice(0, 3).map((tag: any) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                    {prompt.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{prompt.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium">
                        {prompt.user.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <span>{prompt.user.name ?? prompt.user.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{(prompt as any)._count?.comments ?? 0}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Shared {formatDistanceToNow(new Date((prompt as any).sharedAt), { addSuffix: true })}
                  </div>

                  <Link href={`/editor/${prompt.id}`}>
                    <Button className="w-full" variant="outline">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Prompt
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
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
