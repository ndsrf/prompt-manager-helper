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
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Copy,
  HelpCircle,
} from 'lucide-react';
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

const FRAMEWORK_DESCRIPTIONS = {
  default: {
    label: 'Default',
    description:
      'Enhances your prompt by improving clarity, specificity, and structure. Analyzes the prompt for effectiveness across multiple dimensions and provides targeted improvements while maintaining your original intent.',
  },
  raptor: {
    label: 'RAPTOR Framework',
    description:
      'Role – Define the AI\'s persona. Aim – Set a clear task. Parameters – Establish scope and constraints. Tone – Determine communication style. Output – Specify the response format. Review – Enable iteration or refinement.',
  },
  react: {
    label: 'REACT Framework',
    description:
      'You are an assistant that follows the ReAct (Reason + Act) framework, adapted for maximum clarity while respecting hidden reasoning rules.\n\nFor every step:\n\nREASON (Summarized Trace): Provide a clear, step-by-step public explanation of your reasoning process. Use explicit logic, calculations, or deductions in natural language. This should approximate the full thought process as closely as possible, while staying within the boundary of shareable reasoning.\n\nACT: Take an action (e.g., perform a calculation, search, summarize, propose a test, ask a clarifying question).\n\nOBSERVATION/RESULT: Show what came from the action.\n\nLOOP: Refine reasoning based on the result. Repeat steps 1–3 until enough information is gathered.\n\nSTOP + FINAL ANSWER: Provide a clear, concise final solution or explanation.',
  },
};

interface PromptImproverProps {
  promptId: string;
  content: string;
  targetLlm?: string | null;
  onApply: (improvedContent: string) => void;
}

export function PromptImprover({
  promptId,
  content,
  targetLlm,
  onApply,
}: PromptImproverProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [framework, setFramework] = useState<'default' | 'raptor' | 'react'>('default');
  const [showHelp, setShowHelp] = useState(false);

  const { data: usageStats } = trpc.ai.getUsageStats.useQuery();

  const improvePrompt = trpc.ai.improvePrompt.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: 'Analysis Complete',
        description: 'Your prompt has been analyzed and improved',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleImprove = () => {
    improvePrompt.mutate({
      promptId,
      content,
      targetLlm: targetLlm || undefined,
      framework,
    });
  };

  const handleApply = () => {
    if (result?.improved) {
      onApply(result.improved);
      setIsOpen(false);
      toast({
        title: 'Applied',
        description: 'Improved prompt has been applied',
      });
    }
  };

  const handleCopy = () => {
    if (result?.improved) {
      navigator.clipboard.writeText(result.improved);
      toast({
        title: 'Copied',
        description: 'Improved prompt copied to clipboard',
      });
    }
  };

  const canUseAi = usageStats?.unlimited || (usageStats?.remaining ?? 0) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!canUseAi}>
          <Sparkles className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Improve</span>
          {usageStats && !usageStats.unlimited && (
            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
              {usageStats.remaining}/{usageStats.limit}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI-Powered Prompt Improvement</DialogTitle>
          <DialogDescription>
            Analyze and improve your prompt for better results
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Framework Selection */}
          {!result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="framework" className="text-sm font-medium">
                  Improvement Framework
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-full"
                  onClick={() => setShowHelp(true)}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
              <Select value={framework} onValueChange={(value) => setFramework(value as 'default' | 'raptor' | 'react')}>
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Select a framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">
                    {FRAMEWORK_DESCRIPTIONS.default.label}
                  </SelectItem>
                  <SelectItem value="raptor">
                    {FRAMEWORK_DESCRIPTIONS.raptor.label}
                  </SelectItem>
                  <SelectItem value="react">
                    {FRAMEWORK_DESCRIPTIONS.react.label}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Button */}
          {!result && (
            <Button
              onClick={handleImprove}
              disabled={improvePrompt.isPending || !canUseAi}
              className="w-full"
            >
              {improvePrompt.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze & Improve Prompt
                </>
              )}
            </Button>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Score & Metrics */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="text-sm font-semibold">
                      Effectiveness Score
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Overall prompt quality assessment
                    </p>
                  </div>
                  <div className="text-4xl font-bold text-blue-600">
                    {result.score}
                    <span className="text-xl text-muted-foreground">/100</span>
                  </div>
                </div>

                {/* Detailed Metrics */}
                {result.metrics && (
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs font-medium">Clarity</Label>
                        <span className="text-xs font-semibold">{result.metrics.clarity}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${result.metrics.clarity}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs font-medium">Specificity</Label>
                        <span className="text-xs font-semibold">{result.metrics.specificity}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${result.metrics.specificity}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs font-medium">Structure</Label>
                        <span className="text-xs font-semibold">{result.metrics.structure}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${result.metrics.structure}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs font-medium">Context</Label>
                        <span className="text-xs font-semibold">{result.metrics.contextAwareness}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${result.metrics.contextAwareness}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Reasoning */}
              {result.reasoning && (
                <Card className="p-4 bg-amber-50/50">
                  <Label className="text-sm font-semibold mb-2 block">
                    AI Reasoning
                  </Label>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.reasoning}
                  </p>
                </Card>
              )}

              {/* Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <Label className="text-sm font-semibold mb-2 block">
                    Original
                  </Label>
                  <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded max-h-64 overflow-y-auto">
                    {content}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-semibold">Improved</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopy}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-wrap bg-muted p-3 rounded max-h-64 overflow-y-auto border border-primary/20">
                    {result.improved}
                  </div>
                </Card>
              </div>

              {/* Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <Card className="p-4">
                  <Label className="text-sm font-semibold mb-3 block">
                    Suggestions
                  </Label>
                  <ul className="space-y-2">
                    {result.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Changes */}
              {result.changes && result.changes.length > 0 && (
                <Card className="p-4">
                  <Label className="text-sm font-semibold mb-3 block">
                    Key Changes
                  </Label>
                  <ul className="space-y-2">
                    {result.changes.map((change: any, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        {change.type === 'add' && (
                          <Badge variant="default" className="mt-0.5">
                            Added
                          </Badge>
                        )}
                        {change.type === 'modify' && (
                          <Badge variant="secondary" className="mt-0.5">
                            Modified
                          </Badge>
                        )}
                        {change.type === 'remove' && (
                          <Badge variant="destructive" className="mt-0.5">
                            Removed
                          </Badge>
                        )}
                        <span className="text-sm text-foreground flex-1">{change.description}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setIsOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleApply}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Apply Improvements
                </Button>
              </div>
            </>
          )}

          {/* Usage Info */}
          {usageStats && !usageStats.unlimited && (
            <Card className="p-4 bg-muted/50">
              <p className="text-xs text-muted-foreground">
                You have {usageStats.remaining} of {usageStats.limit} AI improvements
                remaining this month. Upgrade to Pro for unlimited improvements.
              </p>
            </Card>
          )}
        </div>
      </DialogContent>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Improvement Frameworks</DialogTitle>
            <DialogDescription>
              Choose the framework that best fits your prompt improvement needs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {/* Default Framework */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Default</Badge>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {FRAMEWORK_DESCRIPTIONS.default.description}
              </p>
            </Card>

            {/* RAPTOR Framework */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">RAPTOR</Badge>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {FRAMEWORK_DESCRIPTIONS.raptor.description}
              </p>
            </Card>

            {/* REACT Framework */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">REACT</Badge>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {FRAMEWORK_DESCRIPTIONS.react.description}
              </p>
            </Card>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowHelp(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
