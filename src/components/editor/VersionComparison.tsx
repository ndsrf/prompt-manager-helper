'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc/client';
import { GitCompare, Clock, User, Camera } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DiffViewer } from './DiffViewer';

interface VersionComparisonProps {
  promptId: string;
}

export function VersionComparison({ promptId }: VersionComparisonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versionId1, setVersionId1] = useState<string>('');
  const [versionId2, setVersionId2] = useState<string>('');

  // @ts-ignore - Type inference issue with tRPC
  const { data: versionsData } = trpc.version.getAll.useQuery(
    { promptId, limit: 100, offset: 0 },
    { enabled: isOpen }
  );

  // @ts-ignore - Type inference issue with tRPC
  const { data: comparisonData, isLoading: isComparing } = trpc.version.compare.useQuery(
    {
      promptId,
      versionId1,
      versionId2,
    },
    {
      enabled: !!versionId1 && !!versionId2 && versionId1 !== versionId2,
    }
  );

  const versions = versionsData?.versions || [];
  const typedComparisonData = comparisonData as any;

  const renderVersionInfo = (version: any, label: string) => (
    <div className="flex-1">
      <h3 className="text-sm font-medium mb-2">{label}</h3>
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">v{version.versionNumber}</Badge>
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
          <p className="text-xs text-primary mt-1">{version.annotation}</p>
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
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitCompare className="h-4 w-4 mr-2" />
          Compare Versions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Versions</DialogTitle>
          <DialogDescription>
            Select two versions to see the differences between them
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Version Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Version 1 (Left)
              </label>
              <Select value={versionId1} onValueChange={setVersionId1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a version..." />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((version: any) => (
                    <SelectItem
                      key={version.id}
                      value={version.id}
                      disabled={version.id === versionId2}
                    >
                      <div className="flex items-center gap-2">
                        <span>v{version.versionNumber}</span>
                        {version.isSnapshot && (
                          <Camera className="h-3 w-3" />
                        )}
                        <span className="text-muted-foreground">-</span>
                        <span className="truncate max-w-[200px]">
                          {version.title}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Version 2 (Right)
              </label>
              <Select value={versionId2} onValueChange={setVersionId2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a version..." />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((version: any) => (
                    <SelectItem
                      key={version.id}
                      value={version.id}
                      disabled={version.id === versionId1}
                    >
                      <div className="flex items-center gap-2">
                        <span>v{version.versionNumber}</span>
                        {version.isSnapshot && (
                          <Camera className="h-3 w-3" />
                        )}
                        <span className="text-muted-foreground">-</span>
                        <span className="truncate max-w-[200px]">
                          {version.title}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comparison Results */}
          {isComparing && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Loading comparison...</p>
            </div>
          )}

          {typedComparisonData && (
            <div className="space-y-4">
              {/* Version Info */}
              <div className="flex gap-4">
                {renderVersionInfo(typedComparisonData.version1, 'Version 1')}
                {renderVersionInfo(typedComparisonData.version2, 'Version 2')}
              </div>

              {/* Content Diff */}
              <div>
                <h3 className="text-sm font-medium mb-2">Content Comparison</h3>
                <DiffViewer
                  oldValue={typedComparisonData.version1.content}
                  newValue={typedComparisonData.version2.content}
                  oldTitle={`v${typedComparisonData.version1.versionNumber}`}
                  newTitle={`v${typedComparisonData.version2.versionNumber}`}
                />
              </div>

              {/* Variables Comparison */}
              {(typedComparisonData.version1.variables ||
                typedComparisonData.version2.variables) && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Variables</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-3">
                      <h4 className="text-xs font-medium mb-2 text-muted-foreground">
                        Version {typedComparisonData.version1.versionNumber}
                      </h4>
                      {typedComparisonData.version1.variables &&
                      Array.isArray(typedComparisonData.version1.variables) &&
                      typedComparisonData.version1.variables.length > 0 ? (
                        <div className="space-y-1">
                          {typedComparisonData.version1.variables.map(
                            (variable: any, index: number) => (
                              <div
                                key={index}
                                className="text-xs flex items-center gap-2"
                              >
                                <code className="bg-muted px-1 rounded">
                                  {variable.name}
                                </code>
                                <Badge variant="outline" className="text-[10px] h-4">
                                  {variable.type}
                                </Badge>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No variables</p>
                      )}
                    </Card>

                    <Card className="p-3">
                      <h4 className="text-xs font-medium mb-2 text-muted-foreground">
                        Version {typedComparisonData.version2.versionNumber}
                      </h4>
                      {typedComparisonData.version2.variables &&
                      Array.isArray(typedComparisonData.version2.variables) &&
                      typedComparisonData.version2.variables.length > 0 ? (
                        <div className="space-y-1">
                          {typedComparisonData.version2.variables.map(
                            (variable: any, index: number) => (
                              <div
                                key={index}
                                className="text-xs flex items-center gap-2"
                              >
                                <code className="bg-muted px-1 rounded">
                                  {variable.name}
                                </code>
                                <Badge variant="outline" className="text-[10px] h-4">
                                  {variable.type}
                                </Badge>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No variables</p>
                      )}
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {!typedComparisonData && versionId1 && versionId2 && !isComparing && (
            <Card className="p-8 text-center">
              <GitCompare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Select two different versions to compare
              </p>
            </Card>
          )}

          {!versionId1 && !versionId2 && (
            <Card className="p-8 text-center">
              <GitCompare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Select two versions from the dropdowns above to begin comparison
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
