import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// Schema for LLM selector configuration
export const LLMConfigSchema = z.object({
  name: z.string(),
  inputSelector: z.string(),
  buttonInsertSelector: z.string(),
  sendButtonSelector: z.string().optional(),
  version: z.string(),
  lastUpdated: z.string(),
});

export type LLMConfig = z.infer<typeof LLMConfigSchema>;

// Server-side selector configurations
// This can be updated without rebuilding the extension
const LLM_SELECTOR_CONFIGS: LLMConfig[] = [
  {
    name: "chatgpt",
    inputSelector:
      "#prompt-textarea, textarea[placeholder*='Message'], div[contenteditable='true'][data-id]",
    buttonInsertSelector: "form button[type='button'], .flex.gap-3.items-center",
    sendButtonSelector:
      "button[data-testid='send-button'], button[data-testid='fruitjuice-send-button']",
    version: "1.0.0",
    lastUpdated: "2025-10-24",
  },
  {
    name: "claude",
    inputSelector: "div[contenteditable='true'][role='textbox']",
    buttonInsertSelector: ".flex.items-center.gap-2",
    sendButtonSelector: "button[aria-label='Send Message']",
    version: "1.0.0",
    lastUpdated: "2025-10-24",
  },
  {
    name: "gemini",
    inputSelector: ".ql-editor[contenteditable='true']",
    buttonInsertSelector: ".action-wrapper",
    sendButtonSelector: "button[aria-label='Send message']",
    version: "1.0.0",
    lastUpdated: "2025-10-24",
  },
  {
    name: "copilot",
    inputSelector:
      "#userInput, textarea[placeholder*='Copilot'], textarea[data-testid='composer-input'], textarea[aria-label='Ask me anything...']",
    buttonInsertSelector: ".controls",
    sendButtonSelector: "button[aria-label='Submit']",
    version: "1.0.0",
    lastUpdated: "2025-10-24",
  },
  {
    name: "m365copilot",
    inputSelector: "#m365-chat-editor-target-element, span[role='combobox'][contenteditable='true'][aria-label='Message Copilot']",
    buttonInsertSelector: ".fai-ChatInput__actions, span.fai-ExpandableChatInput__actions",
    sendButtonSelector: "button[aria-label='Send'], .fai-SendButton",
    version: "1.0.1",
    lastUpdated: "2025-10-27",
  },
  {
    name: "perplexity",
    inputSelector: "textarea[placeholder*='Ask anything']",
    buttonInsertSelector: ".relative.flex",
    sendButtonSelector: "button[aria-label='Submit']",
    version: "1.0.0",
    lastUpdated: "2025-10-24",
  },
];

export const selectorRouter = createTRPCRouter({
  /**
   * Get all LLM selector configurations
   * This is a public endpoint that doesn't require authentication
   */
  getAll: publicProcedure.query(async () => {
    return {
      configs: LLM_SELECTOR_CONFIGS,
      version: "1.0.0",
      lastUpdated: "2025-10-24",
    };
  }),

  /**
   * Get selector configuration for a specific LLM
   */
  getByName: publicProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const config = LLM_SELECTOR_CONFIGS.find((c) => c.name === input.name);

      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `LLM configuration for '${input.name}' not found`,
        });
      }

      return config;
    }),

  /**
   * Get multiple selector configurations by names
   */
  getByNames: publicProcedure
    .input(
      z.object({
        names: z.array(z.string()),
      }),
    )
    .query(async ({ input }) => {
      const configs = LLM_SELECTOR_CONFIGS.filter((c) =>
        input.names.includes(c.name),
      );

      return {
        configs,
        found: configs.length,
        requested: input.names.length,
      };
    }),
});
