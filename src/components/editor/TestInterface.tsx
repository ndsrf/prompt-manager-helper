'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface Variable {
  name: string;
  type: 'text' | 'number' | 'select';
  default?: string;
  options?: string[];
}

interface TestInterfaceProps {
  prompt: {
    id: string;
    title: string;
    targetLlm: string | null;
  };
  content: string;
  variables: Variable[];
  open: boolean;
  onClose: () => void;
}

export function TestInterface({
  prompt,
  content,
  variables,
  open,
  onClose,
}: TestInterfaceProps) {
  const { toast } = useToast();
  const [selectedLlm, setSelectedLlm] = useState<string>(
    prompt.targetLlm || 'chatgpt'
  );
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const [testResult, setTestResult] = useState<string | null>(null);

  const testPrompt = trpc.ai.testPrompt.useMutation({
    onSuccess: (data) => {
      setTestResult(data.response);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleTest = () => {
    // Substitute variables in content
    let finalContent = content;
    variables.forEach((variable) => {
      const value = variableValues[variable.name] || variable.default || '';
      finalContent = finalContent.replace(
        new RegExp(`\\{\\{\\s*${variable.name}\\s*\\}\\}`, 'g'),
        value
      );
    });

    testPrompt.mutate({
      content: finalContent,
      llm: selectedLlm as 'chatgpt' | 'claude' | 'gemini',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Prompt</DialogTitle>
          <DialogDescription>
            Fill in the variables and test your prompt with an AI model
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* LLM Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Test with LLM</Label>
            <Select value={selectedLlm} onValueChange={setSelectedLlm}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chatgpt">ChatGPT (GPT-4o)</SelectItem>
                <SelectItem value="claude">Claude (Sonnet)</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Variable Values */}
          {variables.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Fill in Variables</Label>
                {variables.map((variable: any) => (
                  <div key={variable.name} className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      {'{{'} {variable.name} {'}}'}
                    </Label>
                    {variable.type === 'select' && variable.options ? (
                      <Select
                        value={variableValues[variable.name] || variable.default}
                        onValueChange={(value) =>
                          setVariableValues((prev) => ({
                            ...prev,
                            [variable.name]: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select value" />
                        </SelectTrigger>
                        <SelectContent>
                          {variable.options.map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : variable.type === 'number' ? (
                      <Input
                        type="number"
                        value={variableValues[variable.name] || variable.default || ''}
                        onChange={(e) =>
                          setVariableValues((prev) => ({
                            ...prev,
                            [variable.name]: e.target.value,
                          }))
                        }
                        placeholder={variable.default || `Enter ${variable.name}`}
                      />
                    ) : (
                      <Textarea
                        value={variableValues[variable.name] || variable.default || ''}
                        onChange={(e) =>
                          setVariableValues((prev) => ({
                            ...prev,
                            [variable.name]: e.target.value,
                          }))
                        }
                        placeholder={variable.default || `Enter ${variable.name}`}
                        rows={3}
                        className="resize-y"
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator />

          {/* Test Button */}
          <Button
            onClick={handleTest}
            disabled={testPrompt.isPending}
            className="w-full"
            size="lg"
          >
            {testPrompt.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Test Prompt
              </>
            )}
          </Button>

          {/* Test Result */}
          {testResult && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Response</Label>
                <Card className="p-4 bg-muted/50">
                  <p className="text-sm whitespace-pre-wrap">{testResult}</p>
                </Card>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
