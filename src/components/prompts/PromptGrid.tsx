'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, MoreVertical, Trash2, Edit, Copy, Folder, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PromptGridProps {
  folderId?: string | null;
  tagIds?: string[];
  search?: string;
}

export function PromptGrid({ folderId, tagIds, search }: PromptGridProps) {
  const router = useRouter();

  const { data, isLoading, refetch } = trpc.prompt.getAll.useQuery({
    folderId: folderId === null ? null : folderId,
    tagIds: tagIds && tagIds.length > 0 ? tagIds : undefined,
    search: search || undefined,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
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
    router.push(`/library/${promptId}/edit`);
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.prompts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No prompts found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          {search ? 'Try adjusting your search or filters.' : 'Create your first prompt to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.prompts.map((prompt) => (
        <Card
          key={prompt.id}
          className="hover:border-primary cursor-pointer transition-colors group"
          onClick={() => handleView(prompt.id)}
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg line-clamp-1">{prompt.title}</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 ${
                    prompt.isFavorite ? 'text-yellow-500' : 'text-muted-foreground opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={(e) => handleToggleFavorite(e, prompt.id)}
                >
                  <Star className={`h-4 w-4 ${prompt.isFavorite ? 'fill-current' : ''}`} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
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
          </CardHeader>

          <CardContent>
            {prompt.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                {prompt.description}
              </p>
            )}

            {prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {prompt.tags.slice(0, 3).map((pt) => (
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
          </CardContent>

          <CardFooter className="text-xs text-muted-foreground flex items-center gap-3 pt-0">
            {prompt.folder && (
              <div className="flex items-center gap-1">
                <Folder className="h-3 w-3" />
                <span className="truncate">{prompt.folder.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: true })}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
