'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { TagDialog } from './TagDialog';

interface TagFilterProps {
  selectedTagIds: string[];
  onSelectTags: (tagIds: string[]) => void;
}

export function TagFilter({ selectedTagIds, onSelectTags }: TagFilterProps) {
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const { data: tags, refetch } = trpc.tag.getAll.useQuery();

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectTags(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onSelectTags([...selectedTagIds, tagId]);
    }
  };

  const clearFilters = () => {
    onSelectTags([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase">Tags</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setTagDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {selectedTagIds.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {selectedTagIds.length} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={clearFilters}
          >
            Clear all
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags && tags.length > 0 ? (
          tags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <Badge
                key={tag.id}
                variant={isSelected ? 'default' : 'outline'}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: isSelected ? tag.color || undefined : undefined,
                  borderColor: tag.color || undefined,
                  color: isSelected ? 'white' : tag.color || undefined,
                }}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
                {isSelected && <X className="ml-1 h-3 w-3" />}
                <span className="ml-1 text-xs opacity-70">({tag._count.prompts})</span>
              </Badge>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            No tags yet. Click + to create one.
          </p>
        )}
      </div>

      <TagDialog
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
        onSuccess={() => {
          setTagDialogOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
