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
import { Star, Folder, Lock, Globe, Users, Settings } from 'lucide-react';
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

  const toggleFavorite = trpc.prompt.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.prompt.getById.invalidate({ id: prompt.id });
      toast({
        title: prompt.isFavorite ? 'Removed from favorites' : 'Added to favorites',
      });
    },
  });

  const updatePrompt = trpc.prompt.update.useMutation({
    onSuccess: () => {
      utils.prompt.getById.invalidate({ id: prompt.id });
    },
  });

  const privacyIcons = {
    private: <Lock className="h-4 w-4" />,
    shared: <Users className="h-4 w-4" />,
    public: <Globe className="h-4 w-4" />,
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
              className={`h-4 w-4 mr-2 ${prompt.isFavorite ? 'fill-current' : ''}`}
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
          />
          <div className="space-y-1 leading-none">
            <Label
              htmlFor="applyCustomInstructions"
              className="text-sm font-medium cursor-pointer"
            >
              Apply my custom instructions
            </Label>
            <p className="text-xs text-muted-foreground">
              When enabled, your profile custom instructions will be prepended to the prompt before running tests
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
            {prompt.tags.length === 0 && (
              <p className="text-sm text-muted-foreground">No tags</p>
            )}
            {prompt.tags.map(({ tag }) => (
              <Badge
                key={tag.id}
                variant="secondary"
                style={{
                  backgroundColor: tag.color
                    ? `${tag.color}20`
                    : undefined,
                  color: tag.color || undefined,
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Folder */}
        <div className="space-y-2">
          <Label className="text-sm">Folder</Label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Folder className="h-4 w-4" />
            {prompt.folderId ? 'In a folder' : 'No folder'}
          </div>
        </div>
      </div>
    </Card>
  );
}
