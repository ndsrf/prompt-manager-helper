'use client';

import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Save,
  Sparkles,
  TestTube2,
  History,
  Settings,
  Eye,
  Code,
} from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { VariableManager } from './VariableManager';
import { TokenCounter } from './TokenCounter';
import { TestInterface } from './TestInterface';
import { MetadataPanel } from './MetadataPanel';
import { PromptImprover } from './PromptImprover';
import { VersionHistory } from './VersionHistory';
import { MarkdownPreview } from './MarkdownPreview';

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  content: string;
  variables: any;
  targetLlm: string | null;
  isFavorite: boolean;
  privacy: string;
  folderId: string | null;
  tags: Array<{ tag: { id: string; name: string; color: string | null } }>;
}

interface PromptEditorProps {
  prompt: Prompt;
}

export function PromptEditor({ prompt: initialPrompt }: PromptEditorProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [title, setTitle] = useState(initialPrompt.title);
  const [description, setDescription] = useState(initialPrompt.description || '');
  const [content, setContent] = useState(initialPrompt.content);
  const [variables, setVariables] = useState(initialPrompt.variables || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [showTestInterface, setShowTestInterface] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());

  // @ts-ignore - Type inference issue with tRPC, will be fixed in Phase 3
  const updatePromptMutation = trpc.prompt.update.useMutation({
    onSuccess: () => {
      setHasChanges(false);
      setLastSaved(new Date());
      toast({
        title: 'Saved',
        description: 'Prompt saved successfully',
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

  const handleSave = useCallback(() => {
    updatePromptMutation.mutate({
      id: prompt.id,
      title,
      description: description || null,
      content,
      variables,
    });
  }, [prompt.id, title, description, content, variables, updatePromptMutation]);

  // Track changes
  useEffect(() => {
    const changed =
      title !== initialPrompt.title ||
      description !== (initialPrompt.description || '') ||
      content !== initialPrompt.content ||
      JSON.stringify(variables) !== JSON.stringify(initialPrompt.variables);
    setHasChanges(changed);
  }, [title, description, content, variables, initialPrompt]);

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [hasChanges, handleSave]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleVariablesChange = (newVariables: any[]) => {
    setVariables(newVariables);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
            placeholder="Untitled Prompt"
          />
          {hasChanges && (
            <p className="text-sm text-muted-foreground mt-1">
              Unsaved changes • Auto-save in 30s
            </p>
          )}
          {!hasChanges && (
            <p className="text-sm text-muted-foreground mt-1">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTestInterface(!showTestInterface)}
          >
            <TestTube2 className="h-4 w-4 mr-2" />
            Test
          </Button>
          <PromptImprover
            promptId={prompt.id}
            content={content}
            targetLlm={prompt.targetLlm}
            onApply={(improvedContent) => setContent(improvedContent)}
          />
          <VersionHistory
            promptId={prompt.id}
            currentContent={content}
            onRestore={(restoredContent) => setContent(restoredContent)}
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updatePromptMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updatePromptMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Description */}
      <div>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description (optional)"
          className="border-none shadow-none px-0 focus-visible:ring-0"
        />
      </div>

      <Separator />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Prompt Content</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showPreview ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? (
                      <>
                        <Code className="h-4 w-4 mr-2" />
                        Editor
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </>
                    )}
                  </Button>
                  <TokenCounter content={content} />
                </div>
              </div>
              {!showPreview ? (
                <CodeEditor
                  value={content}
                  onChange={handleContentChange}
                  variables={variables}
                />
              ) : (
                <MarkdownPreview content={content} />
              )}
            </div>
          </Card>

          {/* Variables Section */}
          <Card className="p-6">
            <VariableManager
              variables={variables}
              onChange={handleVariablesChange}
            />
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <MetadataPanel prompt={prompt} />

          {/* Testing Interface */}
          {showTestInterface && (
            <Card className="p-6">
              <TestInterface
                prompt={prompt}
                content={content}
                variables={variables}
                onClose={() => setShowTestInterface(false)}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
