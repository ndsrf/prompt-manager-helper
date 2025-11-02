'use client';

import { useRouter } from 'next/navigation';
import { Star, Copy, ArrowLeft, Calendar, Folder, History, User, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface SharedPromptViewPageProps {
  params: {
    id: string;
  };
}

export default function SharedPromptViewPage({ params }: SharedPromptViewPageProps) {
  const { id } = params;
  const router = useRouter();

  // We need to fetch the prompt through the shared prompts query
  const { data: sharedPrompts, isLoading, refetch } = trpc.share.getSharedWithMe.useQuery({
    limit: 100,
  });

  // Find the specific prompt from the shared prompts list
  const prompt = sharedPrompts?.items?.find((p: any) => p.id === id);

  const copyToLibrary = trpc.prompt.copySharedToLibrary.useMutation({
    onSuccess: (copiedPrompt) => {
      toast({
        title: 'Added to library',
        description: 'The prompt has been copied to your library.',
      });
      router.push(`/library/${copiedPrompt.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const recordUsage = trpc.analytics.recordUsage.useMutation();

  const handleCopyToLibrary = async () => {
    if (prompt) {
      await copyToLibrary.mutateAsync({
        promptId: prompt.id,
        folderId: null,
      });
    }
  };

  const handleCopy = async () => {
    if (prompt) {
      await navigator.clipboard.writeText(prompt.content);
      toast({
        title: 'Copied to clipboard',
        description: 'The prompt content has been copied.',
      });

      // Track usage when copying
      try {
        await recordUsage.mutateAsync({
          promptId: id,
          context: 'copied_from_shared_view',
        });
      } catch (error) {
        // Silently fail - don't disrupt the copy action
        console.error('Failed to record usage:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-10 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Shared prompt not found.</p>
          <Button onClick={() => router.push('/library')} className="mt-4">
            Go to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/library')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Library
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{prompt.title}</h1>
              <Badge variant="secondary" className="text-xs">
                Shared
              </Badge>
            </div>
            {prompt.description && (
              <p className="text-muted-foreground">{prompt.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleCopyToLibrary}
              disabled={copyToLibrary.isPending}
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              {copyToLibrary.isPending ? 'Adding...' : 'Copy to My Library'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Content
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          {prompt.user && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>By {prompt.user.name || prompt.user.email}</span>
            </div>
          )}
          {prompt.folder && (
            <div className="flex items-center gap-1">
              <Folder className="h-4 w-4" />
              <span>{prompt.folder.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Updated {formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: true })}</span>
          </div>
          {prompt.permission && (
            <Badge variant="outline" className="text-xs">
              {prompt.permission} access
            </Badge>
          )}
        </div>

        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {prompt.tags.map((tag: any) => (
              <Badge
                key={tag.id}
                variant="outline"
                style={{
                  borderColor: tag.color || undefined,
                  color: tag.color || undefined,
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle>Prompt Content</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-md">
            {prompt.content}
          </pre>
        </CardContent>
      </Card>

      {prompt.targetLlm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Target LLM:</span>
                <span className="ml-2 text-muted-foreground capitalize">{prompt.targetLlm}</span>
              </div>
              <div>
                <span className="font-medium">Privacy:</span>
                <span className="ml-2 text-muted-foreground capitalize">{prompt.privacy}</span>
              </div>
              <div>
                <span className="font-medium">Usage Count:</span>
                <span className="ml-2 text-muted-foreground">{prompt.usageCount}</span>
              </div>
              <div>
                <span className="font-medium">Shared:</span>
                <span className="ml-2 text-muted-foreground">
                  {formatDistanceToNow(new Date(prompt.sharedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
