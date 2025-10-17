'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface TokenCounterProps {
  content: string;
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'claude';
}

/**
 * Approximate token count for different models
 * GPT models: ~4 characters per token on average
 * Claude models: ~4 characters per token on average
 * This is a good approximation without needing tiktoken/WASM
 */
function approximateTokens(text: string, model: string): number {
  const chars = text.length;

  // Different models have slightly different tokenization
  // but 4 chars/token is a reasonable approximation
  if (model === 'claude') {
    // Claude uses ~4 chars per token
    return Math.ceil(chars / 4);
  }

  // GPT models (gpt-4, gpt-3.5-turbo)
  // Use a slightly more sophisticated approximation
  // Consider spaces, punctuation as separate tokens
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const punctuation = (text.match(/[.,!?;:()[\]{}'"]/g) || []).length;

  // Rough formula: 0.75 tokens per word + punctuation
  return Math.ceil(words * 0.75 + punctuation);
}

export function TokenCounter({ content, model = 'gpt-4' }: TokenCounterProps) {
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [wordCount, setWordCount] = useState<number>(0);

  useEffect(() => {
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const tokens = approximateTokens(content, model);

    setCharCount(chars);
    setWordCount(words);
    setTokenCount(tokens);
  }, [content, model]);

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant="secondary" className="font-mono">
        {charCount.toLocaleString()} chars
      </Badge>
      <Badge variant="secondary" className="font-mono">
        {wordCount.toLocaleString()} words
      </Badge>
      <Badge variant="secondary" className="font-mono">
        ~{tokenCount.toLocaleString()} tokens
      </Badge>
    </div>
  );
}
