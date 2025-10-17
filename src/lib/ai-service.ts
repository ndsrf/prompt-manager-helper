import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization of AI clients
let openaiInstance: OpenAI | null = null;
let anthropicInstance: Anthropic | null = null;

function getOpenAI(): OpenAI | null {
  if (openaiInstance === null && process.env.OPENAI_API_KEY) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

function getAnthropic(): Anthropic | null {
  if (anthropicInstance === null && process.env.ANTHROPIC_API_KEY) {
    anthropicInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicInstance;
}

// For testing: reset client instances
export function resetClients() {
  openaiInstance = null;
  anthropicInstance = null;
}

export interface TestPromptOptions {
  content: string;
  llm: 'chatgpt' | 'claude' | 'gemini';
  maxTokens?: number;
}

export interface ImprovePromptOptions {
  content: string;
  targetLlm?: string;
  context?: string;
}

export interface ImprovePromptResult {
  improved: string;
  score: number;
  suggestions: string[];
  changes: Array<{
    type: 'add' | 'remove' | 'modify';
    description: string;
  }>;
  metrics?: {
    clarity: number;
    specificity: number;
    structure: number;
    contextAwareness: number;
  };
  reasoning?: string;
}

/**
 * Test a prompt with the specified LLM
 */
export async function testPrompt(
  options: TestPromptOptions
): Promise<{ response: string }> {
  const { content, llm, maxTokens = 1000 } = options;

  try {
    switch (llm) {
      case 'chatgpt':
        const openai = getOpenAI();
        if (!openai) {
          throw new Error('OpenAI API key not configured');
        }

        const chatCompletion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content }],
          max_tokens: maxTokens,
        });

        return {
          response: chatCompletion.choices[0]?.message?.content || 'No response',
        };

      case 'claude':
        const anthropic = getAnthropic();
        if (!anthropic) {
          throw new Error('Anthropic API key not configured');
        }

        const message = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content }],
        });

        const textContent = message.content.find((c) => c.type === 'text');
        return {
          response: textContent && 'text' in textContent ? textContent.text : 'No response',
        };

      case 'gemini':
        // Gemini API integration would go here
        throw new Error('Gemini integration not yet implemented');

      default:
        throw new Error(`Unsupported LLM: ${llm}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to test prompt: ${error.message}`);
  }
}

/**
 * Get LLM-specific optimization guidelines
 */
function getLLMGuidelines(targetLlm: string): string {
  const guidelines: Record<string, string> = {
    chatgpt: `
- Use clear, structured formatting (numbered lists, headers)
- Be explicit about desired output format
- Use system messages effectively
- Break complex tasks into steps
- Include examples when possible
- Avoid ambiguous pronouns
- Specify length requirements clearly`,
    claude: `
- Use XML tags for structure (<document>, <context>, etc.)
- Be verbose and detailed in instructions
- Use chain-of-thought prompting
- Include thinking/reasoning steps
- Be explicit about safety/ethical guidelines
- Use role-playing effectively
- Provide clear success criteria`,
    gemini: `
- Use natural, conversational language
- Leverage multimodal capabilities
- Be specific about output format
- Use examples to guide responses
- Include context and background
- Structure with clear sections
- Specify tone and style preferences`,
    any: `
- Use clear, unambiguous language
- Structure information logically
- Include relevant context
- Specify expected output format
- Break down complex requests
- Use examples when helpful
- Be specific about requirements`,
  };
  return guidelines[targetLlm.toLowerCase()] || guidelines.any;
}

/**
 * Analyze and improve a prompt using AI
 */
export async function improvePrompt(
  options: ImprovePromptOptions
): Promise<ImprovePromptResult> {
  const { content, targetLlm = 'any', context = '' } = options;

  const openai = getOpenAI();
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const llmGuidelines = getLLMGuidelines(targetLlm);

    const systemPrompt = `You are an expert prompt engineer with deep knowledge of LLM capabilities and best practices.

Your task is to analyze and improve the given prompt following these steps:

1. **Analyze Current State**
   - Clarity: Is the prompt clear and unambiguous?
   - Specificity: Are requirements well-defined?
   - Structure: Is information well-organized?
   - Context Awareness: Does it provide necessary background?

2. **Identify Issues**
   - Vagueness or ambiguity
   - Missing context or requirements
   - Poor structure or formatting
   - Ineffective language patterns

3. **Apply Best Practices**
${targetLlm !== 'any' ? `   Target LLM: ${targetLlm.toUpperCase()}\n${llmGuidelines}` : llmGuidelines}

4. **Generate Improved Version**
   - Maintain the original intent
   - Enhance clarity and specificity
   - Optimize for the target LLM
   - Add helpful structure and formatting

${context ? `Additional Context: ${context}` : ''}

Respond in JSON format with these fields:
{
  "improved": "The improved prompt text",
  "score": 75,  // Current effectiveness score (0-100)
  "suggestions": ["specific actionable suggestion 1", "suggestion 2", ...],
  "changes": [
    {"type": "add", "description": "describe what was added and why"},
    {"type": "modify", "description": "describe what was changed and why"},
    {"type": "remove", "description": "describe what was removed and why"}
  ],
  "metrics": {
    "clarity": 85,  // How clear and unambiguous (0-100)
    "specificity": 80,  // How well-defined requirements are (0-100)
    "structure": 90,  // How well-organized (0-100)
    "contextAwareness": 75  // How well context is provided (0-100)
  },
  "reasoning": "Brief explanation of the improvement strategy and key changes"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze and improve this prompt:\n\n${content}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 3000,
      temperature: 0.7,
    });

    const result = JSON.parse(
      response.choices[0]?.message?.content || '{}'
    ) as ImprovePromptResult;

    return result;
  } catch (error: any) {
    throw new Error(`Failed to improve prompt: ${error.message}`);
  }
}

/**
 * Analyze prompt for common issues
 */
export async function analyzePrompt(content: string): Promise<{
  issues: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>;
  strengths: string[];
  score: number;
}> {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are a prompt analysis expert. Analyze the given prompt for:
- Common issues (vagueness, ambiguity, missing context, etc.)
- Strengths (clarity, specificity, structure, etc.)
- Overall effectiveness score (0-100)

Respond in JSON format:
{
  "issues": [{"type": "vague", "description": "...", "severity": "medium"}],
  "strengths": ["strength 1", "strength 2"],
  "score": 75
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error: any) {
    throw new Error(`Failed to analyze prompt: ${error.message}`);
  }
}

/**
 * Compare two prompts and explain the differences
 */
export async function comparePrompts(
  original: string,
  improved: string
): Promise<{
  differences: Array<{
    type: 'addition' | 'removal' | 'modification';
    original?: string;
    improved?: string;
    explanation: string;
  }>;
  improvementSummary: string;
  keyBenefits: string[];
}> {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are a prompt engineering expert. Compare the two prompts and explain:
1. What specific changes were made
2. Why each change improves the prompt
3. The overall benefit of the improvements

Focus on concrete, actionable differences.

Respond in JSON format:
{
  "differences": [
    {
      "type": "addition",
      "improved": "text that was added",
      "explanation": "why this addition helps"
    },
    {
      "type": "modification",
      "original": "old text",
      "improved": "new text",
      "explanation": "why this change is better"
    }
  ],
  "improvementSummary": "Overall summary of improvements",
  "keyBenefits": ["benefit 1", "benefit 2", ...]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Original prompt:\n${original}\n\nImproved prompt:\n${improved}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error: any) {
    throw new Error(`Failed to compare prompts: ${error.message}`);
  }
}

/**
 * Generate prompt variations for A/B testing
 */
export async function generateVariations(
  content: string,
  targetLlm: string = 'any',
  count: number = 3
): Promise<Array<{
  variation: string;
  approach: string;
  expectedBenefit: string;
}>> {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are a prompt engineering expert specializing in A/B testing.

Generate ${count} different variations of the given prompt, each using a different approach:
- Different structure or formatting
- Different level of detail
- Different framing or perspective
- Different explicit vs implicit guidance

Each variation should maintain the same goal but test a different hypothesis about what makes prompts effective.

${targetLlm !== 'any' ? `Optimize for ${targetLlm}.` : ''}

Respond in JSON format:
{
  "variations": [
    {
      "variation": "the prompt variation text",
      "approach": "brief description of the approach used",
      "expectedBenefit": "what this variation tests or improves"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate variations for:\n\n${content}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 3000,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return result.variations || [];
  } catch (error: any) {
    throw new Error(`Failed to generate variations: ${error.message}`);
  }
}

/**
 * Suggest variables/placeholders for a prompt
 */
export async function suggestVariables(content: string): Promise<Array<{
  name: string;
  description: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  example: string;
}>> {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are a prompt engineering expert. Analyze the prompt and suggest useful variables/placeholders that could make it more reusable.

Identify:
- Parts that might change between uses
- Values that could be parameterized
- Options that could be selected

Respond in JSON format:
{
  "variables": [
    {
      "name": "variableName",
      "description": "what this variable represents",
      "type": "text",
      "example": "example value"
    },
    {
      "name": "optionVar",
      "type": "select",
      "description": "description",
      "options": ["option1", "option2"],
      "example": "option1"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Suggest variables for:\n\n${content}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return result.variables || [];
  } catch (error: any) {
    throw new Error(`Failed to suggest variables: ${error.message}`);
  }
}
