'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  FlaskConical,
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

interface PromptVariationsProps {
  content: string;
  targetLlm?: string | null;
  onApply: (variation: string) => void;
}

export function PromptVariations({
  content,
  targetLlm,
  onApply,
}: PromptVariationsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [variations, setVariations] = useState<any[]>([]);
  const [count, setCount] = useState<number>(3);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateVariations = trpc.ai.generateVariations.useMutation({
    onSuccess: (data) => {
      setVariations(data);
      toast({
        title: 'Variations Generated',
        description: `Created ${data.length} prompt variations for testing`,
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

  const handleGenerate = () => {
    generateVariations.mutate({
      content,
      targetLlm: targetLlm || undefined,
      count,
    });
  };

  const handleApply = (variation: string) => {
    onApply(variation);
    setIsOpen(false);
    toast({
      title: 'Applied',
      description: 'Variation has been applied to the editor',
    });
  };

  const handleCopy = (variation: string, index: number) => {
    navigator.clipboard.writeText(variation);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: 'Copied',
      description: 'Variation copied to clipboard',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FlaskConical className="h-4 w-4 mr-2" />
          A/B Test Variations
          <Badge variant="secondary" className="ml-2">
            Pro
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Prompt Variations for A/B Testing</DialogTitle>
          <DialogDescription>
            Create multiple variations of your prompt to test different approaches
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Controls */}
          {!variations.length && (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-sm mb-2 block">Number of Variations</Label>
                <Select
                  value={count.toString()}
                  onValueChange={(value) => setCount(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Variations</SelectItem>
                    <SelectItem value="3">3 Variations</SelectItem>
                    <SelectItem value="4">4 Variations</SelectItem>
                    <SelectItem value="5">5 Variations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-sm mb-2 block">&nbsp;</Label>
                <Button
                  onClick={handleGenerate}
                  disabled={generateVariations.isPending}
                  className="w-full"
                >
                  {generateVariations.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Variations
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Original Prompt */}
          {variations.length > 0 && (
            <Card className="p-4">
              <Label className="text-sm font-semibold mb-2 block">
                Original Prompt
              </Label>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded max-h-40 overflow-y-auto">
                {content}
              </div>
            </Card>
          )}

          {/* Variations */}
          {variations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Generated Variations
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVariations([])}
                >
                  Generate New
                </Button>
              </div>

              {variations.map((variation, index) => (
                <Card key={index} className="p-4 border-2 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">Variation {index + 1}</Badge>
                        <span className="text-xs font-medium text-muted-foreground">
                          {variation.approach}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {variation.expectedBenefit}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm whitespace-pre-wrap bg-blue-50/50 p-3 rounded mb-3 max-h-48 overflow-y-auto border border-blue-100">
                    {variation.variation}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(variation.variation, index)}
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApply(variation.variation)}
                    >
                      Use This Variation
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Info */}
          {variations.length === 0 && (
            <Card className="p-4 bg-muted/50">
              <p className="text-xs text-muted-foreground">
                A/B testing allows you to experiment with different prompt formulations
                to find the most effective approach. Each variation maintains your original
                intent while exploring different structures, levels of detail, and framing.
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
