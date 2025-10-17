'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <Card className="p-4 max-h-[600px] overflow-y-auto">
      <Label className="text-sm font-semibold mb-3 block">
        Markdown Preview
      </Label>
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Custom styling for markdown elements
            h1: ({ node, ...props }) => (
              <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-xl font-bold mt-3 mb-2" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-lg font-bold mt-2 mb-1" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="mb-2 text-sm leading-relaxed" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside mb-2 space-y-1" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="text-sm" {...props} />
            ),
            code: ({ node, inline, ...props }: any) =>
              inline ? (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono"
                  {...props}
                />
              ) : (
                <code
                  className="block bg-muted p-3 rounded text-xs font-mono overflow-x-auto my-2"
                  {...props}
                />
              ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-blue-500 pl-4 italic my-2 text-muted-foreground"
                {...props}
              />
            ),
            a: ({ node, ...props }) => (
              <a
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-2">
                <table className="min-w-full border-collapse border border-gray-300" {...props} />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th className="border border-gray-300 px-3 py-2 bg-muted font-semibold text-left text-sm" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="border border-gray-300 px-3 py-2 text-sm" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {!content && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Start typing to see preview
        </p>
      )}
    </Card>
  );
}
