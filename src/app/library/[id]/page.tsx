'use client';

import { useRouter } from 'next/navigation';
import { Star, Edit, Trash2, Copy, ArrowLeft, Calendar, Folder, History, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ShareDialog } from '@/components/sharing/ShareDialog';

interface PromptViewPageProps {
  params: {
    id: string;
  };
}

export default function PromptViewPage({ params }: PromptViewPageProps) {
  const { id } = params;
  const router = useRouter();

  const { data: prompt, isLoading, refetch } = trpc.prompt.getById.useQuery({ id });

  const toggleFavorite = trpc.prompt.toggleFavorite.useMutation({
    onSuccess: () => {
      toast({
        title: 'Updated',
        description: 'Favorite status updated.',
      });
      refetch();
    },
  });

  const deletePrompt = trpc.prompt.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Prompt deleted',
        description: 'The prompt has been moved to trash.',
      });
      router.push('/library');
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

  const handleToggleFavorite = async () => {
    await toggleFavorite.mutateAsync({ id });
  };

  const handleEdit = () => {
    router.push(`/editor/${id}`);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this prompt? You can restore it from trash.')) {
      await deletePrompt.mutateAsync({ id });
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
          context: 'copied_from_detail_view',
        });
      } catch (error) {
        // Silently fail - don't disrupt the copy action
        console.error('Failed to record usage:', error);
      }
    }
  };

  const handleMarkSuccess = async () => {
    try {
      await recordUsage.mutateAsync({
        promptId: id,
        success: true,
        context: 'marked_successful_from_detail_view',
      });
      toast({
        title: 'Marked as successful',
        description: 'This prompt has been marked as successful.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark prompt as successful.',
        variant: 'destructive',
      });
      console.error('Failed to mark success:', error);
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
          <p className="text-muted-foreground">Prompt not found.</p>
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

        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 break-words">{prompt.title}</h1>
            {prompt.description && (
              <p className="text-muted-foreground">{prompt.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleFavorite}
              className={prompt.isFavorite ? 'text-yellow-500' : ''}
            >
              <Star className={`h-4 w-4 ${prompt.isFavorite ? 'fill-current' : ''}`} />
              <span className="ml-2 hidden sm:inline">{prompt.isFavorite ? 'Favorited' : 'Favorite'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Copy</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleMarkSuccess} className="text-green-600 hover:text-green-700">
              <ThumbsUp className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Mark Success</span>
            </Button>
            <ShareDialog
              promptId={id}
              promptTitle={prompt.title}
              currentPrivacy={prompt.privacy as "private" | "shared" | "registered" | "public"}
            />
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Edit</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
              <span className="ml-2 hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
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
          {prompt._count.versions > 0 && (
            <div className="flex items-center gap-1">
              <History className="h-4 w-4" />
              <span>{prompt._count.versions} versions</span>
            </div>
          )}
        </div>

        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {prompt.tags.map((pt: any) => (
              <Badge
                key={pt.tag.id}
                variant="outline"
                style={{
                  borderColor: pt.tag.color || undefined,
                  color: pt.tag.color || undefined,
                }}
              >
                {pt.tag.name}
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
                <span className="font-medium">Created:</span>
                <span className="ml-2 text-muted-foreground">
                  {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {prompt.versions && prompt.versions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prompt.versions.slice(0, 5).map((version: any) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Version {version.versionNumber}</span>
                      {version.isSnapshot && (
                        <Badge variant="secondary" className="text-xs">Snapshot</Badge>
                      )}
                    </div>
                    {version.changesSummary && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {version.changesSummary}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
