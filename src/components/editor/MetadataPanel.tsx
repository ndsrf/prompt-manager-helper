'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/lib/trpc/client';
import { Star, Folder, Lock, Globe, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Prompt {
  id: string;
  title: string;
  targetLlm: string | null;
  isFavorite: boolean;
  privacy: string;
  folderId: string | null;
  applyCustomInstructions?: boolean;
  tags: Array<{ tag: { id: string; name: string; color: string | null } }>;
}

interface MetadataPanelProps {
  prompt: Prompt;
}

export function MetadataPanel({ prompt }: MetadataPanelProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Fetch all tags and folders for selection
  const { data: allTags } = trpc.tag.getAll.useQuery();
  const { data: allFolders } = trpc.folder.getAll.useQuery();

  const toggleFavorite = trpc.prompt.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.prompt.getById.invalidate({ id: prompt.id });
      toast({
        title: prompt.isFavorite ? 'Removed from favorites' : 'Added to favorites',
      });
    },
  });

  // @ts-ignore - Type inference issue with tRPC, will be fixed in Phase 3
  const updatePrompt = trpc.prompt.update.useMutation({
    onSuccess: async () => {
      await utils.prompt.getById.invalidate({ id: prompt.id });
      toast({
        title: 'Updated',
        description: 'Prompt metadata updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const privacyIcons = {
    private: <Lock className="h-4 w-4" />,
    shared: <Users className="h-4 w-4" />,
    public: <Globe className="h-4 w-4" />,
  };

  const toggleTag = (tagId: string) => {
    const currentTagIds = prompt.tags.map(t => t.tag.id);
    const newTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter(id => id !== tagId)
      : [...currentTagIds, tagId];

    updatePrompt.mutate({
      id: prompt.id,
      tagIds: newTagIds,
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <Label className="text-base font-semibold">Metadata</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Configure prompt settings
          </p>
        </div>

        {/* Favorite Toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-sm">Favorite</Label>
          <Button
            variant={prompt.isFavorite ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleFavorite.mutate({ id: prompt.id })}
          >
            <Star
              className={`h-4 w-4 mr-2 ${prompt.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
            />
            {prompt.isFavorite ? 'Favorited' : 'Add to Favorites'}
          </Button>
        </div>

        {/* Target LLM */}
        <div className="space-y-2">
          <Label className="text-sm">Target LLM</Label>
          <Select
            value={prompt.targetLlm || 'any'}
            onValueChange={(value) =>
              updatePrompt.mutate({
                id: prompt.id,
                targetLlm: value === 'any' ? null : value,
              })
            }
            disabled={updatePrompt.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select LLM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any LLM</SelectItem>
              <SelectItem value="chatgpt">ChatGPT</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="llama">Llama</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Apply Custom Instructions */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="applyCustomInstructions"
            checked={prompt.applyCustomInstructions ?? true}
            onCheckedChange={(checked) =>
              updatePrompt.mutate({
                id: prompt.id,
                applyCustomInstructions: checked === true,
              })
            }
            disabled={updatePrompt.isPending}
          />
          <div className="space-y-1 leading-none">
            <Label
              htmlFor="applyCustomInstructions"
              className="text-sm font-medium cursor-pointer"
            >
              Apply my custom instructions
            </Label>
            <p className="text-xs text-muted-foreground">
              When enabled, your profile custom instructions will be prepended to this prompt
            </p>
          </div>
        </div>

        {/* Privacy */}
        <div className="space-y-2">
          <Label className="text-sm">Privacy</Label>
          <Select
            value={prompt.privacy}
            onValueChange={(value: any) =>
              updatePrompt.mutate({
                id: prompt.id,
                privacy: value,
              })
            }
            disabled={updatePrompt.isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Private
                </div>
              </SelectItem>
              <SelectItem value="shared">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Shared
                </div>
              </SelectItem>
              <SelectItem value="public">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Public
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-sm">Tags</Label>
          <div className="flex flex-wrap gap-2">
            {allTags && allTags.length > 0 ? (
              allTags.map((tag: any) => {
                const isSelected = prompt.tags.some(pt => pt.tag.id === tag.id);
                return (
                  <Badge
                    key={tag.id}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`cursor-pointer hover:opacity-80 transition-opacity ${updatePrompt.isPending ? 'opacity-50 pointer-events-none' : ''}`}
                    style={{
                      backgroundColor: isSelected ? tag.color || undefined : undefined,
                      borderColor: tag.color || undefined,
                      color: isSelected ? 'white' : tag.color || undefined,
                    }}
                    onClick={() => !updatePrompt.isPending && toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No tags available
              </p>
            )}
          </div>
        </div>

        {/* Folder */}
        <div className="space-y-2">
          <Label className="text-sm">Folder</Label>
          <Select
            value={prompt.folderId || 'none'}
            onValueChange={(value) =>
              updatePrompt.mutate({
                id: prompt.id,
                folderId: value === 'none' ? null : value,
              })
            }
            disabled={updatePrompt.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  No folder
                </div>
              </SelectItem>
              {allFolders?.map((folder: any) => (
                <SelectItem key={folder.id} value={folder.id}>
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    {folder.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
