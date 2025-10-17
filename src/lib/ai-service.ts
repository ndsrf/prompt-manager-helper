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
    const systemPrompt = `You are an expert prompt engineer. Analyze the given prompt and provide improvements.

Your task:
1. Analyze the prompt for clarity, specificity, and effectiveness
2. Provide an improved version of the prompt
3. Give it a score from 0-100 (current effectiveness)
4. List 3-5 specific suggestions for improvement
5. Describe the key changes made

${targetLlm !== 'any' ? `The prompt will be used with ${targetLlm}, so optimize for that LLM.` : ''}
${context ? `Additional context: ${context}` : ''}

Respond in JSON format:
{
  "improved": "improved prompt text",
  "score": 75,
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "changes": [
    {"type": "add", "description": "what was added"},
    {"type": "modify", "description": "what was modified"},
    {"type": "remove", "description": "what was removed"}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze and improve this prompt:\n\n${content}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
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
