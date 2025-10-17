// Create a mock create function that we can control
const mockCreate = jest.fn();

// Mock OpenAI - MUST be before imports
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

import {
  improvePrompt,
  comparePrompts,
  generateVariations,
  suggestVariables,
  resetClients,
} from '../ai-service';

describe('AI Service - Advanced Features', () => {
  beforeEach(() => {
    resetClients();
    process.env.OPENAI_API_KEY = 'test-key';
    jest.clearAllMocks();

    // Set default mock response
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              improved: 'Improved prompt content',
              score: 85,
              suggestions: ['Add more context', 'Be more specific'],
              changes: [
                {
                  type: 'add',
                  description: 'Added clearer structure',
                },
              ],
              metrics: {
                clarity: 90,
                specificity: 85,
                structure: 88,
                contextAwareness: 80,
              },
              reasoning: 'Improved clarity and added structure',
            }),
          },
        },
      ],
    });
  });

  describe('improvePrompt with metrics', () => {
    it('should return improvement with detailed metrics', async () => {
      const result = await improvePrompt({
        content: 'Write a story',
        targetLlm: 'chatgpt',
      });

      expect(result).toHaveProperty('improved');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('changes');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('reasoning');

      // Check metrics structure
      expect(result.metrics).toHaveProperty('clarity');
      expect(result.metrics).toHaveProperty('specificity');
      expect(result.metrics).toHaveProperty('structure');
      expect(result.metrics).toHaveProperty('contextAwareness');
    });

    it('should handle different target LLMs', async () => {
      const targets = ['chatgpt', 'claude', 'gemini', 'any'];

      for (const targetLlm of targets) {
        const result = await improvePrompt({
          content: 'Test prompt',
          targetLlm,
        });

        expect(result).toHaveProperty('improved');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('comparePrompts', () => {
    it('should compare two prompts and explain differences', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                differences: [
                  {
                    type: 'addition',
                    improved: 'Added context',
                    explanation: 'Provides background information',
                  },
                ],
                improvementSummary: 'Added clarity and context',
                keyBenefits: ['Better clarity', 'More specific'],
              }),
            },
          },
        ],
      });

      const result = await comparePrompts(
        'Write a story',
        'Write a creative short story about adventure'
      );

      expect(result).toHaveProperty('differences');
      expect(result).toHaveProperty('improvementSummary');
      expect(result).toHaveProperty('keyBenefits');
      expect(Array.isArray(result.differences)).toBe(true);
      expect(Array.isArray(result.keyBenefits)).toBe(true);
    });
  });

  describe('generateVariations', () => {
    it('should generate multiple prompt variations', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                variations: [
                  {
                    variation: 'Variation 1',
                    approach: 'Structured approach',
                    expectedBenefit: 'Better organization',
                  },
                  {
                    variation: 'Variation 2',
                    approach: 'Detailed approach',
                    expectedBenefit: 'More specificity',
                  },
                  {
                    variation: 'Variation 3',
                    approach: 'Concise approach',
                    expectedBenefit: 'Faster responses',
                  },
                ],
              }),
            },
          },
        ],
      });

      const result = await generateVariations('Test prompt', 'chatgpt', 3);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('variation');
      expect(result[0]).toHaveProperty('approach');
      expect(result[0]).toHaveProperty('expectedBenefit');
    });

    it('should respect count parameter', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                variations: Array(5).fill({
                  variation: 'Test variation',
                  approach: 'Test approach',
                  expectedBenefit: 'Test benefit',
                }),
              }),
            },
          },
        ],
      });

      const result = await generateVariations('Test prompt', 'any', 5);

      expect(result).toHaveLength(5);
    });
  });

  describe('suggestVariables', () => {
    it('should suggest variables for a prompt', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                variables: [
                  {
                    name: 'topic',
                    description: 'The main topic',
                    type: 'text',
                    example: 'science fiction',
                  },
                  {
                    name: 'tone',
                    description: 'The writing tone',
                    type: 'select',
                    options: ['formal', 'casual', 'humorous'],
                    example: 'casual',
                  },
                  {
                    name: 'wordCount',
                    description: 'Target word count',
                    type: 'number',
                    example: '500',
                  },
                ],
              }),
            },
          },
        ],
      });

      const result = await suggestVariables('Write a story about {{topic}}');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('example');

      // Check variable types
      const textVar = result.find((v) => v.type === 'text');
      const selectVar = result.find((v) => v.type === 'select');
      const numberVar = result.find((v) => v.type === 'number');

      expect(textVar).toBeDefined();
      expect(selectVar).toBeDefined();
      expect(numberVar).toBeDefined();
      expect(selectVar?.options).toBeDefined();
      expect(Array.isArray(selectVar?.options)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle API key not configured', async () => {
      delete process.env.OPENAI_API_KEY;
      resetClients();

      await expect(improvePrompt({ content: 'test' })).rejects.toThrow(
        'OpenAI API key not configured'
      );

      await expect(
        comparePrompts('original', 'improved')
      ).rejects.toThrow('OpenAI API key not configured');

      await expect(generateVariations('test')).rejects.toThrow(
        'OpenAI API key not configured'
      );

      await expect(suggestVariables('test')).rejects.toThrow(
        'OpenAI API key not configured'
      );
    });

    it('should handle API errors gracefully', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      resetClients();
      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(improvePrompt({ content: 'test' })).rejects.toThrow(
        'Failed to improve prompt'
      );
    });
  });
});
