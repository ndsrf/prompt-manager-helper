'use client';

import { useEffect } from 'react';
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
import { toast } from '@/hooks/use-toast';

const folderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
});

type FolderFormData = z.infer<typeof folderSchema>;

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: any;
  parentId?: string;
  onSuccess: () => void;
}

export function FolderDialog({ open, onOpenChange, folder, parentId, onSuccess }: FolderDialogProps) {
  const isEditing = !!folder;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FolderFormData>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: folder?.name || '',
      description: folder?.description || '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: folder?.name || '',
        description: folder?.description || '',
      });
    }
  }, [open, folder, reset]);

  const createFolder = trpc.folder.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Folder created',
        description: 'The folder has been created successfully.',
      });
      reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateFolder = trpc.folder.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Folder updated',
        description: 'The folder has been updated successfully.',
      });
      reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: FolderFormData) => {
    if (isEditing) {
      await updateFolder.mutateAsync({
        id: folder.id,
        ...data,
      });
    } else {
      await createFolder.mutateAsync({
        ...data,
        parentId,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Folder' : 'Create Folder'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the folder details below.'
              : 'Create a new folder to organize your prompts.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter folder name"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="Enter folder description (optional)"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
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
