'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { History, Clock, User, FileText, RotateCcw, Camera, Edit2, Trash2, GitCompare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DiffViewer } from './DiffViewer';

interface Version {
  id: string;
  versionNumber: number;
  title: string;
  content: string;
  changesSummary: string | null;
  annotation: string | null;
  isSnapshot: boolean;
  createdAt: Date;
  creator?: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface VersionHistoryProps {
  promptId: string;
  currentContent: string;
  currentTitle: string;
  onRestore?: (content: string, title: string) => void;
  children?: React.ReactNode;
}

export function VersionHistory({
  promptId,
  currentContent,
  currentTitle,
  onRestore,
  children,
}: VersionHistoryProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [compareVersion, setCompareVersion] = useState<Version | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [snapshotAnnotation, setSnapshotAnnotation] = useState('');
  const [editingAnnotation, setEditingAnnotation] = useState('');
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);

  const { data: versionsData, isLoading } = trpc.version.getAll.useQuery(
    { promptId, limit: 50, offset: 0 },
    { enabled: isOpen }
  );

  // @ts-ignore - Type inference issue with tRPC
  const restoreMutation = trpc.version.restore.useMutation({
    onSuccess: (data: any) => {
      if (onRestore) {
        onRestore(data.prompt.content, data.prompt.title);
      }
      utils.version.getAll.invalidate({ promptId });
      utils.prompt.getById.invalidate({ id: promptId });
      setShowRestoreDialog(false);
      setIsOpen(false);
      toast({
        title: 'Version Restored',
        description: `Restored to version ${selectedVersion?.versionNumber}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // @ts-ignore - Type inference issue with tRPC
  const createSnapshotMutation = trpc.version.createSnapshot.useMutation({
    onSuccess: () => {
      utils.version.getAll.invalidate({ promptId });
      setShowSnapshotDialog(false);
      setSnapshotAnnotation('');
      toast({
        title: 'Snapshot Created',
        description: 'A manual snapshot has been created',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // @ts-ignore - Type inference issue with tRPC
  const updateAnnotationMutation = trpc.version.updateAnnotation.useMutation({
    onSuccess: () => {
      utils.version.getAll.invalidate({ promptId });
      setShowAnnotationDialog(false);
      setEditingVersionId(null);
      setEditingAnnotation('');
      toast({
        title: 'Annotation Updated',
        description: 'Version annotation has been updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRestore = (version: Version) => {
    setSelectedVersion(version);
    setShowRestoreDialog(true);
  };

  const confirmRestore = () => {
    if (selectedVersion) {
      restoreMutation.mutate({ versionId: selectedVersion.id });
    }
  };

  const handleCreateSnapshot = () => {
    if (snapshotAnnotation.trim()) {
      createSnapshotMutation.mutate({
        promptId,
        annotation: snapshotAnnotation.trim(),
      });
    }
  };

  const handleUpdateAnnotation = (version: Version) => {
    setEditingVersionId(version.id);
    setEditingAnnotation(version.annotation || '');
    setShowAnnotationDialog(true);
  };

  const confirmUpdateAnnotation = () => {
    if (editingVersionId) {
      updateAnnotationMutation.mutate({
        versionId: editingVersionId,
        annotation: editingAnnotation,
      });
    }
  };

  const versions = versionsData?.versions || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children || (
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">History</span>
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View, compare, and restore previous versions of your prompt
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSnapshotDialog(true)}
            >
              <Camera className="h-4 w-4 mr-2" />
              Create Snapshot
            </Button>
            <div className="text-xs text-muted-foreground ml-auto">
              {versionsData?.total || 0} version{versionsData?.total !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="space-y-4">
            {isLoading && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Loading versions...</p>
              </div>
            )}

            {!isLoading && versions.length === 0 && (
              <Card className="p-6 text-center">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No version history available
                </p>
              </Card>
            )}

            {versions.length > 0 && (
              <div className="space-y-3">
                {versions.map((version: any) => (
                  <Card
                    key={version.id}
                    className={`p-4 transition-colors ${
                      selectedVersion?.id === version.id ? 'border-primary bg-muted/30' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            v{version.versionNumber}
                          </Badge>
                          {version.isSnapshot && (
                            <Badge variant="default">
                              <Camera className="h-3 w-3 mr-1" />
                              Snapshot
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{version.title}</p>
                        {version.changesSummary && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {version.changesSummary}
                          </p>
                        )}
                        {version.annotation && (
                          <div className="flex items-start gap-2 mt-1">
                            <p className="text-xs text-primary flex-1">
                              {version.annotation}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1"
                              onClick={() => handleUpdateAnnotation(version)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(version.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          {version.creator?.name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {version.creator.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (selectedVersion?.id === version.id) {
                              setShowDiff(!showDiff);
                            } else {
                              setSelectedVersion(version);
                              setShowDiff(true);
                            }
                          }}
                        >
                          <GitCompare className="h-4 w-4 mr-2" />
                          {selectedVersion?.id === version.id && showDiff ? 'Hide' : 'Compare'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRestore(version)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </div>
                    </div>

                    {selectedVersion?.id === version.id && showDiff && (
                      <div className="mt-4 pt-4 border-t">
                        <DiffViewer
                          oldValue={currentContent}
                          newValue={version.content}
                          oldTitle="Current Version"
                          newTitle={`Version ${version.versionNumber}`}
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Snapshot Dialog */}
      <Dialog open={showSnapshotDialog} onOpenChange={setShowSnapshotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Snapshot</DialogTitle>
            <DialogDescription>
              Save the current state of your prompt as a named snapshot
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="annotation">Snapshot Note</Label>
              <Textarea
                id="annotation"
                placeholder="e.g., Final version before restructuring..."
                value={snapshotAnnotation}
                onChange={(e) => setSnapshotAnnotation(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {snapshotAnnotation.length}/500 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSnapshotDialog(false);
                setSnapshotAnnotation('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSnapshot}
              disabled={!snapshotAnnotation.trim() || createSnapshotMutation.isPending}
            >
              {createSnapshotMutation.isPending ? 'Creating...' : 'Create Snapshot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Annotation Dialog */}
      <Dialog open={showAnnotationDialog} onOpenChange={setShowAnnotationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Annotation</DialogTitle>
            <DialogDescription>
              Update the note for this version
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-annotation">Annotation</Label>
              <Textarea
                id="edit-annotation"
                placeholder="Enter annotation..."
                value={editingAnnotation}
                onChange={(e) => setEditingAnnotation(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {editingAnnotation.length}/500 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAnnotationDialog(false);
                setEditingAnnotation('');
                setEditingVersionId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUpdateAnnotation}
              disabled={updateAnnotationMutation.isPending}
            >
              {updateAnnotationMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version {selectedVersion?.versionNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new version with the content from version {selectedVersion?.versionNumber}.
              Your current changes will be preserved in the version history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              disabled={restoreMutation.isPending}
            >
              {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
