'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  Home,
  Library,
  Share2,
} from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { VariableManager } from './VariableManager';
import { TokenCounter } from './TokenCounter';
import { TestInterface } from './TestInterface';
import { MetadataPanel } from './MetadataPanel';
import { PromptImprover } from './PromptImprover';
import { VersionHistory } from './VersionHistory';
import { VersionComparison } from './VersionComparison';
import { MarkdownPreview } from './MarkdownPreview';
import { PromptVariations } from './PromptVariations';
import { VariableSuggester } from './VariableSuggester';
import { ShareDialog } from '../sharing/ShareDialog';
import { CommentSection } from '../sharing/CommentSection';

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
  applyCustomInstructions?: boolean;
  tags: Array<{ tag: { id: string; name: string; color: string | null } }>;
}

interface PromptEditorProps {
  prompt: Prompt;
  userId?: string;
}

export function PromptEditor({ prompt: initialPrompt, userId }: PromptEditorProps) {
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

  // Sync with prop changes (e.g., when metadata is updated)
  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

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
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Navigation Links */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/library">
            <Library className="h-4 w-4 mr-2" />
            Library
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl sm:text-2xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
            placeholder="Untitled Prompt"
          />
          {hasChanges && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Unsaved changes • Auto-save in 30s
            </p>
          )}
          {!hasChanges && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTestInterface(!showTestInterface)}
            className="flex-1 sm:flex-none"
          >
            <TestTube2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Test</span>
          </Button>
          <PromptImprover
            promptId={prompt.id}
            content={content}
            targetLlm={prompt.targetLlm}
            onApply={(improvedContent) => setContent(improvedContent)}
          />
          <PromptVariations
            content={content}
            targetLlm={prompt.targetLlm}
            onApply={(variation) => setContent(variation)}
          />
          <VersionHistory
            promptId={prompt.id}
            currentContent={content}
            currentTitle={title}
            onRestore={(restoredContent, restoredTitle) => {
              setContent(restoredContent);
              setTitle(restoredTitle);
            }}
          />
          <VersionComparison promptId={prompt.id} />
          <ShareDialog
            promptId={prompt.id}
            promptTitle={title}
            currentPrivacy={prompt.privacy as any}
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updatePromptMutation.isPending}
            className="flex-1 sm:flex-none"
          >
            <Save className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {updatePromptMutation.isPending ? 'Saving...' : 'Save'}
            </span>
          </Button>
        </div>
      </div>

      {/* Description */}
      <div>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description (optional)"
          className="border-none shadow-none px-0 focus-visible:ring-0 text-sm sm:text-base"
        />
      </div>

      <Separator />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Editor Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-3 sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <Label className="text-sm sm:text-base font-semibold">Prompt Content</Label>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant={showPreview ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex-1 sm:flex-none"
                  >
                    {showPreview ? (
                      <>
                        <Code className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Editor</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Preview</span>
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
          <Card className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-0">
              <Label className="text-sm sm:text-base font-semibold">Variables</Label>
              <VariableSuggester
                content={content}
                onAddVariable={(variable) => {
                  const newVariables = [...variables, variable];
                  setVariables(newVariables);
                }}
              />
            </div>
            <VariableManager
              variables={variables}
              onChange={handleVariablesChange}
            />
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <MetadataPanel prompt={prompt} />
        </div>
      </div>

      {/* Testing Interface Dialog */}
      <TestInterface
        prompt={prompt}
        content={content}
        variables={variables}
        open={showTestInterface}
        onClose={() => setShowTestInterface(false)}
      />

      {/* Comments Section */}
      {userId && (
        <div className="mt-8">
          <Separator className="mb-6" />
          <CommentSection promptId={prompt.id} currentUserId={userId} />
        </div>
      )}
    </div>
  );
}
