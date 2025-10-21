'use client';

import { useState } from 'react';
import { Search, Plus, LayoutGrid, LayoutList, Home, Library as LibraryIcon } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />

      <div className="relative z-10 container mx-auto py-4 px-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              title="Back to Dashboard"
              className="hover:bg-white/10 text-white"
            >
              <Home className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
                <LibraryIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                  Prompt Library
                </h1>
                <p className="text-sm sm:text-base text-gray-400 mt-1">
                  Manage and organize your prompts
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleCreatePrompt}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Prompt
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Sidebar - Folders and Tags */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 sm:p-4">
              <FolderTree
                selectedFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
              />
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 sm:p-4">
              <TagFilter
                selectedTagIds={selectedTagIds}
                onSelectTags={setSelectedTagIds}
              />
            </div>
          </div>

          {/* Main Content - Prompt List */}
          <div className="lg:col-span-9">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
              {/* Search and View Mode */}
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                    <Input
                      placeholder="Search prompts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
                    />
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-md w-full sm:w-auto p-1">
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`rounded-r-none flex-1 sm:flex-none ${
                        viewMode === 'list'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <LayoutList className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`rounded-l-none flex-1 sm:flex-none ${
                        viewMode === 'grid'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/10" />

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
    </div>
  );
}
