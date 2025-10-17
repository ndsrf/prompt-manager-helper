'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { trpc } from '@/lib/trpc/client';
import { toast } from '@/hooks/use-toast';
import { FolderDialog } from './FolderDialog';

interface FolderNode {
  id: string;
  name: string;
  description: string | null;
  level: number;
  children: FolderNode[];
  _count: {
    prompts: number;
    children: number;
  };
}

interface FolderTreeProps {
  selectedFolderId?: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

export function FolderTree({ selectedFolderId, onSelectFolder }: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [parentFolderId, setParentFolderId] = useState<string | undefined>(undefined);

  const { data: folders, isLoading, refetch } = trpc.folder.getTree.useQuery();
  const deleteFolder = trpc.folder.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Folder deleted',
        description: 'The folder has been deleted successfully.',
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

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = (parentId?: string) => {
    setEditingFolder(null);
    setParentFolderId(parentId);
    setFolderDialogOpen(true);
  };

  const handleEditFolder = (folder: FolderNode) => {
    setEditingFolder(folder);
    setFolderDialogOpen(true);
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (confirm('Are you sure you want to delete this folder? Prompts inside will be moved to the root.')) {
      await deleteFolder.mutateAsync({ id: folderId });
      if (selectedFolderId === folderId) {
        onSelectFolder(null);
      }
    }
  };

  const handleDialogSuccess = () => {
    setFolderDialogOpen(false);
    setEditingFolder(null);
    setParentFolderId(undefined);
    refetch();
  };

  const renderFolder = (folder: FolderNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = folder.children.length > 0;

    return (
      <div key={folder.id} className="select-none">
        <div
          className={`flex items-center gap-1 py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer group ${
            isSelected ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                toggleFolder(folder.id);
              }
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
          </Button>

          <div
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={() => onSelectFolder(folder.id)}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 flex-shrink-0 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 flex-shrink-0 text-blue-500" />
            )}
            <span className="text-sm truncate flex-1">{folder.name}</span>
            {folder._count.prompts > 0 && (
              <span className="text-xs text-muted-foreground">{folder._count.prompts}</span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCreateFolder(folder.id)}>
                <Plus className="h-4 w-4 mr-2" />
                New Subfolder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditFolder(folder)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteFolder(folder.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {folder.children.map((child: any) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-8 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase">Folders</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => handleCreateFolder()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer ${
          selectedFolderId === null ? 'bg-accent' : ''
        }`}
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="h-4 w-4 text-blue-500" />
        <span className="text-sm">All Prompts</span>
      </div>

      {folders && folders.length > 0 ? (
        folders.map((folder: any) => renderFolder(folder))
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No folders yet. Click + to create one.
        </p>
      )}

      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        folder={editingFolder}
        parentId={parentFolderId}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
