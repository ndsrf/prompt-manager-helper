'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
});

type TagFormData = z.infer<typeof tagSchema>;

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b',
];

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: any;
  onSuccess: () => void;
}

export function TagDialog({ open, onOpenChange, tag, onSuccess }: TagDialogProps) {
  const { toast } = useToast();
  const isEditing = !!tag;
  const [selectedColor, setSelectedColor] = useState(tag?.color || DEFAULT_COLORS[0]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: tag?.name || '',
      color: tag?.color || DEFAULT_COLORS[0],
    },
  });

  useEffect(() => {
    if (open) {
      const color = tag?.color || DEFAULT_COLORS[0];
      reset({
        name: tag?.name || '',
        color,
      });
      setSelectedColor(color);
    }
  }, [open, tag, reset]);

  const createTag = trpc.tag.create.useMutation();

  const updateTag = trpc.tag.update.useMutation();

  const onSubmit = async (data: TagFormData) => {
    try {
      if (isEditing) {
        await updateTag.mutateAsync({
          id: tag.id,
          ...data,
        });
        toast({
          title: 'Tag updated',
          description: 'The tag has been updated successfully.',
        });
        reset();
        onSuccess();
      } else {
        await createTag.mutateAsync(data);
        toast({
          title: 'Tag created',
          description: 'The tag has been created successfully.',
        });
        reset();
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue('color', color);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the tag details below.'
              : 'Create a new tag to categorize your prompts.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter tag name"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Color *</Label>
            <div className="grid grid-cols-9 gap-2">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-md transition-all ${
                    selectedColor === color
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                />
              ))}
            </div>
            {errors.color && (
              <p className="text-sm text-destructive">{errors.color.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
