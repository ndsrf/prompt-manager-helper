'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, MoreVertical, Trash2, Edit, Copy, Folder, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PromptListProps {
  folderId?: string | null;
  tagIds?: string[];
  search?: string;
}

export function PromptList({ folderId, tagIds, search }: PromptListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);

  console.log('[PromptList] Component rendered with props:', { folderId, tagIds, search });

  const { data, isLoading, error, refetch } = trpc.prompt.getAll.useQuery({
    folderId: folderId === null ? null : folderId,
    tagIds: tagIds && tagIds.length > 0 ? tagIds : undefined,
    search: search || undefined,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  console.log('[PromptList] Query state:', {
    isLoading,
    hasError: !!error,
    errorMessage: error?.message,
    hasData: !!data,
    promptCount: data?.prompts?.length
  });

  const toggleFavorite = trpc.prompt.toggleFavorite.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deletePrompt = trpc.prompt.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Prompt deleted',
        description: 'The prompt has been moved to trash.',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleToggleFavorite = async (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    await toggleFavorite.mutateAsync({ id: promptId });
  };

  const handleEdit = (promptId: string) => {
    router.push(`/editor/${promptId}`);
  };

  const handleView = (promptId: string) => {
    router.push(`/library/${promptId}`);
  };

  const handleDelete = async (promptId: string) => {
    if (confirm('Are you sure you want to delete this prompt? You can restore it from trash.')) {
      await deletePrompt.mutateAsync({ id: promptId });
    }
  };

  const handleCopy = async (prompt: any) => {
    await navigator.clipboard.writeText(prompt.content);
    toast({
      title: 'Copied to clipboard',
      description: 'The prompt content has been copied.',
    });
  };

  if (error) {
    console.error('[PromptList] Error occurred:', error);
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-semibold mb-2">Error loading prompts</p>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    console.log('[PromptList] Rendering loading skeletons...');
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-6 w-3/4 mb-2" data-testid={`skeleton-title-${i}`} />
            <Skeleton className="h-4 w-full mb-2" data-testid={`skeleton-description-${i}`} />
            <Skeleton className="h-4 w-1/2" data-testid={`skeleton-meta-${i}`} />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.prompts.length === 0) {
    console.log('[PromptList] No data or empty prompts array');
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No prompts found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          {search ? 'Try adjusting your search or filters.' : 'Create your first prompt to get started.'}
        </p>
      </div>
    );
  }

  console.log('[PromptList] Rendering prompts list with', data.prompts.length, 'prompts');

  return (
    <div className="space-y-3">
      {data.prompts.map((prompt: any) => (
        <div
          key={prompt.id}
          className="border rounded-lg p-3 sm:p-4 hover:bg-accent/50 cursor-pointer transition-colors group"
          onClick={() => handleView(prompt.id)}
        >
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-base sm:text-lg truncate">{prompt.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 flex-shrink-0 ${
                    prompt.isFavorite ? 'text-yellow-500' : 'text-muted-foreground sm:opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={(e) => handleToggleFavorite(e, prompt.id)}
                >
                  <Star className={`h-4 w-4 ${prompt.isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </div>

              {prompt.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
                  {prompt.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                {prompt.folder && (
                  <div className="flex items-center gap-1">
                    <Folder className="h-3 w-3" />
                    <span className="truncate max-w-[100px] sm:max-w-none">{prompt.folder.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="hidden sm:inline">{formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: true })}</span>
                  <span className="sm:hidden">{formatDistanceToNow(new Date(prompt.updatedAt))}</span>
                </div>
                {prompt._count.versions > 0 && (
                  <span className="hidden sm:inline">{prompt._count.versions} versions</span>
                )}
              </div>

              {prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 sm:mt-3">
                  {prompt.tags.slice(0, 3).map((pt: any) => (
                    <Badge
                      key={pt.tag.id}
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: pt.tag.color || undefined,
                        color: pt.tag.color || undefined,
                      }}
                    >
                      {pt.tag.name}
                    </Badge>
                  ))}
                  {prompt.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{prompt.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0 sm:opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(prompt.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopy(prompt)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Content
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(prompt.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
