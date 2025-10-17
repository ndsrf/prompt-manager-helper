'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { toast } from '@/hooks/use-toast';

const variableSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'number', 'select']),
  default: z.string().optional(),
  options: z.array(z.string()).optional(),
});

const promptSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  targetLlm: z.string().optional(),
  folderId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).default([]),
  privacy: z.enum(['private', 'shared', 'public']).default('private'),
  isFavorite: z.boolean().default(false),
});

type PromptFormData = z.infer<typeof promptSchema>;

export default function NewPromptPage() {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: folders } = trpc.folder.getAll.useQuery();
  const { data: tags } = trpc.tag.getAll.useQuery();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      targetLlm: 'any',
      folderId: null,
      tagIds: [],
      privacy: 'private',
      isFavorite: false,
    },
  });

  const createPrompt = trpc.prompt.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Prompt created',
        description: 'Your prompt has been created successfully.',
      });
      router.push(`/library/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: PromptFormData) => {
    await createPrompt.mutateAsync({
      ...data,
      tagIds: selectedTags,
    });
  };

  const toggleTag = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
    setValue('tagIds', newTags);
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create New Prompt</h1>
        <p className="text-muted-foreground mt-1">
          Add a new prompt to your library
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Enter prompt title"
                autoFocus
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="Enter a brief description (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Prompt Content *</Label>
              <textarea
                id="content"
                {...register('content')}
                className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your prompt content here..."
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Use {'{{variable}}'} syntax for template variables
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetLlm">Target LLM</Label>
              <Select
                onValueChange={(value) => setValue('targetLlm', value)}
                defaultValue="any"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target LLM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="chatgpt">ChatGPT</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder">Folder</Label>
              <Select
                onValueChange={(value) => setValue('folderId', value === 'none' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders?.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags && tags.length > 0 ? (
                  tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <Badge
                        key={tag.id}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer hover:opacity-80"
                        style={{
                          backgroundColor: isSelected ? tag.color || undefined : undefined,
                          borderColor: tag.color || undefined,
                          color: isSelected ? 'white' : tag.color || undefined,
                        }}
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No tags available. Create tags from the library page.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacy">Privacy</Label>
              <Select
                onValueChange={(value: 'private' | 'shared' | 'public') => setValue('privacy', value)}
                defaultValue="private"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select privacy level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isFavorite"
                {...register('isFavorite')}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isFavorite" className="cursor-pointer">
                Mark as favorite
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Prompt'}
          </Button>
        </div>
      </form>
    </div>
  );
}
