// Mock OpenAI and Anthropic BEFORE any imports
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

// Set environment variables BEFORE importing the module
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

import { testPrompt, improvePrompt, analyzePrompt, resetClients } from '../ai-service';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

describe('AI Service', () => {
  describe('testPrompt', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      resetClients(); // Reset client instances
      (OpenAI as any).mockClear();
      (Anthropic as any).mockClear();
    });

    it('should test prompt with ChatGPT', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Test response from GPT',
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockCreate,
              },
            },
          } as any)
      );

      const result = await testPrompt({
        content: 'Test prompt',
        llm: 'chatgpt',
      });

      expect(result.response).toBe('Test response from GPT');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Test prompt' }],
        })
      );
    });

    it('should test prompt with Claude', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: 'Test response from Claude',
          },
        ],
      });

      (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(
        () =>
          ({
            messages: {
              create: mockCreate,
            },
          } as any)
      );

      const result = await testPrompt({
        content: 'Test prompt',
        llm: 'claude',
      });

      expect(result.response).toBe('Test response from Claude');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Test prompt' }],
        })
      );
    });

    it('should throw error for Gemini (not implemented)', async () => {
      await expect(
        testPrompt({
          content: 'Test prompt',
          llm: 'gemini',
        })
      ).rejects.toThrow('Gemini integration not yet implemented');
    });

    it('should handle API errors gracefully', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockCreate,
              },
            },
          } as any)
      );

      await expect(
        testPrompt({
          content: 'Test prompt',
          llm: 'chatgpt',
        })
      ).rejects.toThrow('Failed to test prompt: API Error');
    });

    it('should use custom maxTokens when provided', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockCreate,
              },
            },
          } as any)
      );

      await testPrompt({
        content: 'Test prompt',
        llm: 'chatgpt',
        maxTokens: 500,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 500,
        })
      );
    });
  });

  describe('improvePrompt', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      resetClients(); // Reset client instances
      (OpenAI as any).mockClear();
    });

    it('should improve prompt and return structured result', async () => {
      const mockResponse = {
        improved: 'Improved prompt text',
        score: 75,
        suggestions: ['Suggestion 1', 'Suggestion 2'],
        changes: [
          { type: 'add', description: 'Added clarity' },
          { type: 'modify', description: 'Modified structure' },
        ],
      };

      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockCreate,
              },
            },
          } as any)
      );

      const result = await improvePrompt({
        content: 'Original prompt',
      });

      expect(result.improved).toBe('Improved prompt text');
      expect(result.score).toBe(75);
      expect(result.suggestions).toHaveLength(2);
      expect(result.changes).toHaveLength(2);
    });

    it('should include target LLM in system prompt', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                improved: 'Test',
                score: 80,
                suggestions: [],
                changes: [],
              }),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockCreate,
              },
            },
          } as any)
      );

      await improvePrompt({
        content: 'Test prompt',
        targetLlm: 'claude',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('claude'),
            }),
          ]),
        })
      );
    });

    it('should include context in system prompt', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                improved: 'Test',
                score: 80,
                suggestions: [],
                changes: [],
              }),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockCreate,
              },
            },
          } as any)
      );

      await improvePrompt({
        content: 'Test prompt',
        context: 'Additional context here',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Additional context here'),
            }),
          ]),
        })
      );
    });

    it('should use JSON response format', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                improved: 'Test',
                score: 80,
                suggestions: [],
                changes: [],
              }),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockCreate,
              },
            },
          } as any)
      );

      await improvePrompt({ content: 'Test' });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          response_format: { type: 'json_object' },
        })
      );
    });
  });

  describe('analyzePrompt', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      resetClients(); // Reset client instances
      (OpenAI as any).mockClear();
    });

    it('should analyze prompt and return issues and strengths', async () => {
      const mockResponse = {
        issues: [
          { type: 'vague', description: 'Lacks specificity', severity: 'medium' },
        ],
        strengths: ['Clear objective', 'Good structure'],
        score: 70,
      };

      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockResponse),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockCreate,
              },
            },
          } as any)
      );

      const result = await analyzePrompt('Test prompt');

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('vague');
      expect(result.strengths).toHaveLength(2);
      expect(result.score).toBe(70);
    });

    it('should handle API errors', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('Rate limit exceeded'));

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: mockCreate,
              },
            },
          } as any)
      );

      await expect(analyzePrompt('Test prompt')).rejects.toThrow(
        'Failed to analyze prompt: Rate limit exceeded'
      );
    });
  });
});
