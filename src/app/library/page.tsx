'use client';

import { useState } from 'react';
import { Search, Plus, LayoutGrid, LayoutList, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FolderTree } from '@/components/folders/FolderTree';
import { PromptList } from '@/components/prompts/PromptList';
import { PromptGrid } from '@/components/prompts/PromptGrid';
import { TagFilter } from '@/components/tags/TagFilter';
import { useRouter } from 'next/navigation';

export default function LibraryPage() {
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const handleCreatePrompt = () => {
    router.push('/library/new');
  };

  return (
    <div className="container mx-auto py-4 px-4 sm:py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
            title="Back to Dashboard"
          >
            <Home className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Prompt Library</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage and organize your prompts
            </p>
          </div>
        </div>
        <Button onClick={handleCreatePrompt} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Sidebar - Folders and Tags */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <div className="border rounded-lg p-3 sm:p-4">
            <FolderTree
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
            />
          </div>

          <div className="border rounded-lg p-3 sm:p-4">
            <TagFilter
              selectedTagIds={selectedTagIds}
              onSelectTags={setSelectedTagIds}
            />
          </div>
        </div>

        {/* Main Content - Prompt List */}
        <div className="lg:col-span-9">
          <div className="border rounded-lg">
            {/* Search and View Mode */}
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-1 border rounded-md w-full sm:w-auto">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-r-none flex-1 sm:flex-none"
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-l-none flex-1 sm:flex-none"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Prompt List/Grid */}
            <div className="p-3 sm:p-4">
              {viewMode === 'list' ? (
                <PromptList
                  folderId={selectedFolderId}
                  tagIds={selectedTagIds}
                  search={searchQuery}
                />
              ) : (
                <PromptGrid
                  folderId={selectedFolderId}
                  tagIds={selectedTagIds}
                  search={searchQuery}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
