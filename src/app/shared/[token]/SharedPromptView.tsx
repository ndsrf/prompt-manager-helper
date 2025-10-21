"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CommentSection } from "@/components/sharing/CommentSection";
import {
  ExternalLink,
  Copy,
  Eye,
  Edit,
  User,
  Calendar,
  Tag,
  Clock,
  AlertCircle,
  BookmarkPlus,
  ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface SharedPromptViewProps {
  token: string;
  userId: string;
}

export function SharedPromptView({ token, userId }: SharedPromptViewProps) {
  const router = useRouter();
  const [isCopying, setIsCopying] = useState(false);

  const { data: prompt, isLoading, error } = trpc.share.getByShareToken.useQuery({
    shareToken: token,
  });

  const copyToLibraryMutation = trpc.prompt.copyFromShare.useMutation({
    onSuccess: (copiedPrompt) => {
      toast({
        title: "Prompt copied successfully",
        description: "The prompt has been added to your library as a private prompt",
      });
      router.push(`/editor/${copiedPrompt.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to copy prompt",
        description: error.message,
        variant: "destructive",
      });
      setIsCopying(false);
    },
  });

  const handleCopyContent = () => {
    if (prompt) {
      void navigator.clipboard.writeText(prompt.content);
      toast({
        title: "Copied to clipboard",
        description: "Prompt content has been copied",
      });
    }
  };

  const handleCopyToLibrary = () => {
    setIsCopying(true);
    copyToLibraryMutation.mutate({
      shareToken: token,
      folderId: null,
    });
  };

  const handleOpenInEditor = () => {
    if (prompt) {
      router.push(`/editor/${prompt.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6 max-w-4xl">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-destructive" />
            <h3 className="mt-4 text-lg font-semibold">Prompt not found</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {error?.message ?? "This share link is invalid or has expired."}
            </p>
            <Button onClick={() => router.push("/library")} className="mt-6">
              Go to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEdit = (prompt as any).permission === "edit" || (prompt as any).permission === "admin";
  const isExpiringSoon = (prompt as any).expiresAt &&
    new Date((prompt as any).expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h1 className="text-3xl font-bold">{prompt.title}</h1>
            {prompt.description && (
              <p className="text-muted-foreground">{prompt.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1">
              {(prompt as any).permission === "view" ? (
                <Eye className="h-3 w-3" />
              ) : (
                <Edit className="h-3 w-3" />
              )}
              {(prompt as any).permission}
            </Badge>
          </div>
        </div>

        {/* Warning for expiring soon */}
        {isExpiringSoon && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100">
              <Clock className="h-4 w-4" />
              <span>
                This share link will expire{" "}
                {formatDistanceToNow(new Date((prompt as any).expiresAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>{prompt.user.name ?? prompt.user.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              Shared {formatDistanceToNow(new Date((prompt as any).sharedAt), { addSuffix: true })}
            </span>
          </div>
          {(prompt as any).expiresAt && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                Expires on {format(new Date((prompt as any).expiresAt), "MMM d, yyyy")}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {prompt.tags.map((tag: any) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleCopyToLibrary} disabled={isCopying}>
            <BookmarkPlus className="mr-2 h-4 w-4" />
            {isCopying ? "Copying..." : "Copy to my library"}
          </Button>
          {canEdit && (
            <Button onClick={handleOpenInEditor} variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in Editor
            </Button>
          )}
          <Button onClick={handleCopyContent} variant="outline">
            <Copy className="mr-2 h-4 w-4" />
            Copy Content
          </Button>
        </div>
      </div>

      <Separator />

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Prompt Content</CardTitle>
          {prompt.targetLlm && (
            <CardDescription>Optimized for {prompt.targetLlm}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-x-auto">
            {prompt.content}
          </pre>
        </CardContent>
      </Card>

      {/* Variables */}
      {Array.isArray(prompt.variables) && prompt.variables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Variables</CardTitle>
            <CardDescription>
              This prompt uses the following variables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(prompt.variables as any[]).map((variable: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <code className="text-sm font-mono">{`{{${variable.name}}}`}</code>
                    {variable.description && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {variable.description}
                      </p>
                    )}
                  </div>
                  {variable.defaultValue && (
                    <Badge variant="outline">Default: {variable.defaultValue}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Comments */}
      <CommentSection promptId={prompt.id} currentUserId={userId} />
    </div>
  );
}
