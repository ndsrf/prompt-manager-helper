'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Loader2,
  Plus,
  Variable,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface VariableSuggesterProps {
  content: string;
  onAddVariable: (variable: {
    name: string;
    type: 'text' | 'number' | 'select';
    options?: string[];
    example: string;
  }) => void;
}

export function VariableSuggester({
  content,
  onAddVariable,
}: VariableSuggesterProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const { refetch, isFetching, data } = trpc.ai.suggestVariables.useQuery(
    { content },
    {
      enabled: false,
    }
  );

  // Handle success/error with useEffect
  useEffect(() => {
    if (data && data.length > 0) {
      setSuggestions(data);
      toast({
        title: 'Suggestions Generated',
        description: `Found ${data.length} potential variables`,
      });
    }
  }, [data, toast]);

  const handleGenerate = () => {
    refetch();
  };

  const handleAdd = (variable: any) => {
    onAddVariable(variable);
    toast({
      title: 'Variable Added',
      description: `Added {{${variable.name}}} to your prompt`,
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-700';
      case 'number':
        return 'bg-green-100 text-green-700';
      case 'select':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Variable className="h-4 w-4 mr-2" />
          Suggest Variables
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI-Powered Variable Suggestions</DialogTitle>
          <DialogDescription>
            Let AI analyze your prompt and suggest useful variables to make it more reusable
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Generate Button */}
          {suggestions.length === 0 && (
            <Button
              onClick={handleGenerate}
              disabled={isFetching}
              className="w-full"
            >
              {isFetching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze & Suggest Variables
                </>
              )}
            </Button>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Suggested Variables ({suggestions.length})
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSuggestions([])}
                >
                  Regenerate
                </Button>
              </div>

              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {`{{${suggestion.name}}}`}
                          </code>
                          <Badge className={getTypeColor(suggestion.type)} variant="secondary">
                            {suggestion.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {suggestion.description}
                        </p>
                        {suggestion.options && suggestion.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className="text-xs text-muted-foreground">Options:</span>
                            {suggestion.options.map((option: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {option}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Example:</span>{' '}
                          <code className="bg-muted px-1 py-0.5 rounded">{suggestion.example}</code>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAdd(suggestion)}
                        className="ml-4"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Info */}
          {suggestions.length === 0 && !isFetching && (
            <Card className="p-4 bg-muted/50">
              <p className="text-xs text-muted-foreground">
                Variable suggestions help you make your prompts more reusable by identifying
                parts that might change between uses. The AI will analyze your prompt and
                suggest appropriate variables with their types and example values.
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
