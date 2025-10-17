# AI-Powered Improvement Engine

## Overview

The AI-Powered Improvement Engine is a comprehensive system for analyzing, improving, and optimizing prompts for various LLMs (ChatGPT, Claude, Gemini, etc.). It leverages advanced AI capabilities to provide intelligent suggestions, detailed metrics, and actionable improvements.

## Features

### 1. Prompt Improvement

Analyze and improve prompts with detailed insights and LLM-specific optimizations.

#### Key Capabilities:
- **Multi-dimensional Scoring**: Get detailed scores for clarity, specificity, structure, and context awareness
- **LLM-Specific Optimization**: Tailored improvements based on target LLM (ChatGPT, Claude, Gemini)
- **AI Reasoning**: Understand the improvement strategy with detailed explanations
- **Actionable Suggestions**: Receive specific, implementable recommendations
- **Change Tracking**: See exactly what was added, modified, or removed

#### Usage:

```typescript
import { improvePrompt } from '@/lib/ai-service';

const result = await improvePrompt({
  content: 'Write a story',
  targetLlm: 'chatgpt', // or 'claude', 'gemini', 'any'
  context: 'This will be used for creative writing exercises',
});

console.log(result);
// {
//   improved: "Write a creative short story (500-800 words)...",
//   score: 85,
//   suggestions: [
//     "Add word count requirements",
//     "Specify genre or theme",
//     "Include formatting guidelines"
//   ],
//   changes: [
//     {
//       type: "add",
//       description: "Added specific word count range for clarity"
//     }
//   ],
//   metrics: {
//     clarity: 90,
//     specificity: 85,
//     structure: 88,
//     contextAwareness: 80
//   },
//   reasoning: "Enhanced clarity by adding specific requirements..."
// }
```

#### Metrics Explained:

- **Clarity (0-100)**: How clear and unambiguous the prompt is
- **Specificity (0-100)**: How well-defined the requirements are
- **Structure (0-100)**: How well-organized the information is
- **Context Awareness (0-100)**: How well context and background are provided

### 2. LLM-Specific Guidelines

The engine applies best practices specific to each LLM:

#### ChatGPT Optimization:
- Clear, structured formatting (numbered lists, headers)
- Explicit output format specification
- Effective system message usage
- Step-by-step task breakdown
- Example inclusion
- Avoidance of ambiguous pronouns
- Clear length requirements

#### Claude Optimization:
- XML tag structure (`<document>`, `<context>`, etc.)
- Verbose and detailed instructions
- Chain-of-thought prompting
- Thinking/reasoning steps
- Explicit safety/ethical guidelines
- Effective role-playing
- Clear success criteria

#### Gemini Optimization:
- Natural, conversational language
- Multimodal capability leverage
- Specific output format
- Example-guided responses
- Rich context and background
- Clear section structure
- Tone and style preferences

### 3. Prompt Variations (A/B Testing)

Generate multiple variations of your prompt to test different approaches.

#### Features:
- Generate 2-5 variations per prompt
- Each variation uses a different strategy
- Understand the expected benefit of each approach
- Pro and Enterprise feature

#### Usage:

```typescript
import { generateVariations } from '@/lib/ai-service';

const variations = await generateVariations(
  'Write a blog post about AI',
  'chatgpt',
  3 // number of variations
);

console.log(variations);
// [
//   {
//     variation: "Structured approach variation...",
//     approach: "Highly structured with clear sections",
//     expectedBenefit: "Better organization and readability"
//   },
//   {
//     variation: "Detailed approach variation...",
//     approach: "More detailed instructions with examples",
//     expectedBenefit: "Increased specificity and clarity"
//   },
//   {
//     variation: "Concise approach variation...",
//     approach: "Brief and to-the-point",
//     expectedBenefit: "Faster responses and less token usage"
//   }
// ]
```

#### UI Component:

```tsx
import { PromptVariations } from '@/components/editor/PromptVariations';

<PromptVariations
  content={promptContent}
  targetLlm="chatgpt"
  onApply={(variation) => {
    // Apply the selected variation
    setContent(variation);
  }}
/>
```

### 4. Prompt Comparison

Compare two prompts and understand the specific differences and improvements.

#### Features:
- Detailed difference analysis
- Explanation of why each change improves the prompt
- Summary of overall improvements
- Key benefits list

#### Usage:

```typescript
import { comparePrompts } from '@/lib/ai-service';

const comparison = await comparePrompts(
  'Write a story',
  'Write a creative short story (500-800 words) about adventure...'
);

console.log(comparison);
// {
//   differences: [
//     {
//       type: "addition",
//       improved: "500-800 words",
//       explanation: "Provides specific length requirement for consistency"
//     },
//     {
//       type: "modification",
//       original: "Write a story",
//       improved: "Write a creative short story",
//       explanation: "More specific genre and style guidance"
//     }
//   ],
//   improvementSummary: "Added clarity through specific requirements...",
//   keyBenefits: [
//     "Clearer expectations for output length",
//     "Better genre specification",
//     "More actionable instructions"
//   ]
// }
```

### 5. Variable Suggestions

AI-powered suggestions for making prompts more reusable with variables.

#### Features:
- Automatic variable identification
- Type detection (text, number, select)
- Option suggestions for select variables
- Example values for each variable

#### Usage:

```typescript
import { suggestVariables } from '@/lib/ai-service';

const suggestions = await suggestVariables(
  'Write a blog post about technology'
);

console.log(suggestions);
// [
//   {
//     name: "topic",
//     description: "The main subject of the blog post",
//     type: "text",
//     example: "artificial intelligence"
//   },
//   {
//     name: "tone",
//     description: "The writing style and tone",
//     type: "select",
//     options: ["professional", "casual", "technical"],
//     example: "professional"
//   },
//   {
//     name: "wordCount",
//     description: "Target word count for the post",
//     type: "number",
//     example: "1000"
//   }
// ]
```

#### UI Component:

```tsx
import { VariableSuggester } from '@/components/editor/VariableSuggester';

<VariableSuggester
  content={promptContent}
  onAddVariable={(variable) => {
    // Add the suggested variable
    const newVariables = [...variables, variable];
    setVariables(newVariables);
  }}
/>
```

## API Endpoints

### tRPC Procedures

All AI features are exposed through tRPC procedures:

```typescript
// Improve prompt
const result = await trpc.ai.improvePrompt.mutate({
  promptId: 'uuid',
  content: 'prompt content',
  targetLlm: 'chatgpt',
  context: 'optional context',
});

// Compare prompts
const comparison = await trpc.ai.comparePrompts.query({
  original: 'original prompt',
  improved: 'improved prompt',
});

// Generate variations (Pro/Enterprise only)
const variations = await trpc.ai.generateVariations.mutate({
  content: 'prompt content',
  targetLlm: 'chatgpt',
  count: 3,
});

// Suggest variables
const suggestions = await trpc.ai.suggestVariables.query({
  content: 'prompt content',
});

// Get usage stats
const stats = await trpc.ai.getUsageStats.query();
```

## Tier Limits

### Free Tier
- 5 AI improvements per month
- Basic analysis features
- No variation generation
- Variable suggestions available

### Pro Tier
- Unlimited AI improvements
- All analysis features
- Variation generation (up to 5)
- Variable suggestions
- Priority processing

### Enterprise Tier
- Everything in Pro
- Custom API rate limits
- Dedicated support
- Advanced analytics

## UI Components

### PromptImprover

Enhanced modal dialog for prompt improvement with metrics visualization.

```tsx
<PromptImprover
  promptId={prompt.id}
  content={content}
  targetLlm={prompt.targetLlm}
  onApply={(improvedContent) => setContent(improvedContent)}
/>
```

**Features:**
- Effectiveness score display
- Detailed metrics with progress bars (clarity, specificity, structure, context)
- AI reasoning explanation
- Side-by-side comparison
- Suggestions list
- Change tracking
- Copy and apply actions

### PromptVariations

Dialog for generating and selecting prompt variations.

```tsx
<PromptVariations
  content={content}
  targetLlm={prompt.targetLlm}
  onApply={(variation) => setContent(variation)}
/>
```

**Features:**
- Variable count selection (2-5)
- Original prompt reference
- Variation cards with approach and benefits
- Copy and apply actions
- Pro tier badge

### VariableSuggester

Dialog for AI-powered variable suggestions.

```tsx
<VariableSuggester
  content={content}
  onAddVariable={(variable) => {
    const newVariables = [...variables, variable];
    setVariables(newVariables);
  }}
/>
```

**Features:**
- Automatic variable analysis
- Type-specific badges
- Option display for select variables
- Example values
- One-click add to prompt

## Integration Example

Here's a complete example of integrating all AI features into a prompt editor:

```tsx
'use client';

import { useState } from 'react';
import { PromptImprover } from '@/components/editor/PromptImprover';
import { PromptVariations } from '@/components/editor/PromptVariations';
import { VariableSuggester } from '@/components/editor/VariableSuggester';

export function EnhancedPromptEditor({ prompt }) {
  const [content, setContent] = useState(prompt.content);
  const [variables, setVariables] = useState(prompt.variables || []);

  return (
    <div>
      {/* Action buttons */}
      <div className="flex gap-2">
        <PromptImprover
          promptId={prompt.id}
          content={content}
          targetLlm={prompt.targetLlm}
          onApply={(improved) => setContent(improved)}
        />

        <PromptVariations
          content={content}
          targetLlm={prompt.targetLlm}
          onApply={(variation) => setContent(variation)}
        />

        <VariableSuggester
          content={content}
          onAddVariable={(variable) => {
            setVariables([...variables, variable]);
          }}
        />
      </div>

      {/* Editor content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-64"
      />
    </div>
  );
}
```

## Best Practices

1. **Target LLM Selection**: Always specify the target LLM for best results
2. **Provide Context**: Include context about how the prompt will be used
3. **Iterative Improvement**: Apply improvements, test, and refine
4. **A/B Testing**: Use variations to find the most effective approach
5. **Variable Usage**: Make prompts reusable with suggested variables
6. **Metrics Monitoring**: Track improvement metrics over time

## Error Handling

All AI functions throw descriptive errors:

```typescript
try {
  const result = await improvePrompt({ content: 'test' });
} catch (error) {
  if (error.message.includes('API key not configured')) {
    // Handle missing API key
  } else if (error.message.includes('Monthly limit reached')) {
    // Handle tier limit
  } else {
    // Handle other errors
  }
}
```

## Testing

Comprehensive test suite included:

```bash
# Run AI service tests
npm run test src/lib/__tests__/ai-service.test.ts
npm run test src/lib/__tests__/ai-service-advanced.test.ts
```

## Performance Considerations

- **Caching**: Results are not cached; each request is fresh
- **Token Usage**: Varies by model and prompt length
- **Response Time**: 2-10 seconds depending on complexity
- **Rate Limiting**: Applied based on user tier

## Future Enhancements

- Real-time prompt scoring as you type
- Historical improvement tracking
- Custom improvement rules
- Multi-language support
- Collaborative improvement suggestions
- Integration with prompt testing results

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/yourusername/prompteasy/issues)
- Review the [PROJECT_PLAN.md](../PROJECT_PLAN.md)
- Contact support for Enterprise users

---

**Version**: 1.0.0
**Last Updated**: 2025-10-17
**Status**: Production Ready
