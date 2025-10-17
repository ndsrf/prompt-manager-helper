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
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';
import { X, Send, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  onClose: () => void;
}

export function TestInterface({
  prompt,
  content,
  variables,
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Test Prompt</Label>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* LLM Selection */}
      <div className="space-y-2">
        <Label className="text-sm">Test with LLM</Label>
        <Select value={selectedLlm} onValueChange={setSelectedLlm}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chatgpt">ChatGPT (GPT-4)</SelectItem>
            <SelectItem value="claude">Claude (Sonnet)</SelectItem>
            <SelectItem value="gemini">Gemini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Variable Values */}
      {variables.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm">Fill in Variables</Label>
          {variables.map((variable) => (
            <div key={variable.name} className="space-y-1">
              <Label className="text-xs text-muted-foreground">
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
                    {variable.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={variable.type === 'number' ? 'number' : 'text'}
                  value={variableValues[variable.name] || variable.default || ''}
                  onChange={(e) =>
                    setVariableValues((prev) => ({
                      ...prev,
                      [variable.name]: e.target.value,
                    }))
                  }
                  placeholder={variable.default || `Enter ${variable.name}`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Test Button */}
      <Button
        onClick={handleTest}
        disabled={testPrompt.isPending}
        className="w-full"
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
        <Card className="p-4 bg-muted/50">
          <Label className="text-sm font-semibold">Response</Label>
          <p className="text-sm mt-2 whitespace-pre-wrap">{testResult}</p>
        </Card>
      )}
    </div>
  );
}
