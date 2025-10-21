'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';
import { PromptEditor } from '@/components/editor/PromptEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function EditorPage() {
  const params = useParams();
  const promptId = params.id as string;
  const { data: session } = useSession();

  const { data: prompt, isLoading, error } = trpc.prompt.getById.useQuery({
    id: promptId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-96 w-full" />
            </Card>
          </div>
          <div>
            <Card className="p-6">
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-64 w-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-gray-600">
            {error?.message || 'Prompt not found'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <PromptEditor prompt={prompt} userId={session?.user?.id} />
    </div>
  );
}
