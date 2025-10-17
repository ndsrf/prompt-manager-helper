'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { History, Clock, User, FileText, RotateCcw } from 'lucide-react';
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
}

interface VersionHistoryProps {
  promptId: string;
  currentContent: string;
  onRestore: (content: string) => void;
}

export function VersionHistory({
  promptId,
  currentContent,
  onRestore,
}: VersionHistoryProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const { data: versions, isLoading } = trpc.prompt.getVersions.useQuery(
    { promptId },
    { enabled: isOpen }
  );

  const handleRestore = (version: Version) => {
    onRestore(version.content);
    setIsOpen(false);
    toast({
      title: 'Version Restored',
      description: `Restored version ${version.versionNumber}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View and restore previous versions of your prompt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Loading versions...</p>
            </div>
          )}

          {!isLoading && (!versions || versions.length === 0) && (
            <Card className="p-6 text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No version history available
              </p>
            </Card>
          )}

          {versions && versions.length > 0 && (
            <div className="space-y-3">
              {versions.map((version: any) => (
                <Card
                  key={version.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedVersion?.id === version.id ? 'border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          Version {version.versionNumber}
                        </Badge>
                        {version.isSnapshot && (
                          <Badge variant="default">Snapshot</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">{version.title}</p>
                      {version.changesSummary && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {version.changesSummary}
                        </p>
                      )}
                      {version.annotation && (
                        <p className="text-xs text-blue-600 mt-1">
                          Note: {version.annotation}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(version.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedVersion?.id === version.id && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDiff(!showDiff);
                            }}
                          >
                            {showDiff ? 'Hide' : 'Show'} Diff
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(version);
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Diff Viewer */}
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
  );
}
