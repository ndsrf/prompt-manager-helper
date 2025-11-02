import { z } from 'zod'

// Variable schema
export const variableSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'number', 'select']),
  default: z.string().optional(),
  options: z.array(z.string()).optional(),
})

export type Variable = z.infer<typeof variableSchema>

// Prompt schema - dates come as strings from API
export const promptSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  content: z.string(),
  variables: z.array(variableSchema).default([]),
  targetLlm: z.string().nullable(),
  isFavorite: z.boolean().default(false),
  privacy: z.enum(['private', 'shared', 'public']).default('private'),
  usageCount: z.number().default(0),
  applyCustomInstructions: z.boolean().default(true),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  folder: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable().optional(),
  tags: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string().nullable(),
  })).default([]),
})

export type Prompt = z.infer<typeof promptSchema>

// Auth schema
export const authStateSchema = z.object({
  isAuthenticated: z.boolean(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    customInstructions: z.string().nullable().optional(),
  }).nullable(),
  token: z.string().nullable(),
})

export type AuthState = z.infer<typeof authStateSchema>

// Settings schema
export const settingsSchema = z.object({
  apiUrl: z.string().default('https://prompteasy.ndsrf.com'),
  theme: z.enum(['light', 'dark', 'futuristic', 'system']).default('system'),
  autoInsert: z.boolean().default(false),
  showVariablePrompt: z.boolean().default(true),
  cacheEnabled: z.boolean().default(true),
  syncInterval: z.number().default(300000), // 5 minutes
})

export type Settings = z.infer<typeof settingsSchema>

// Detected LLM type
export type DetectedLLM =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'copilot'
  | 'm365copilot'
  | 'perplexity'
  | 'unknown'

// Message types for chrome.runtime messaging
export type MessageType =
  | 'GET_PROMPTS'
  | 'INSERT_PROMPT'
  | 'COPY_PROMPT'
  | 'MARK_SUCCESS'
  | 'SAVE_PROMPT'
  | 'IMPROVE_PROMPT'
  | 'GET_AUTH_STATE'
  | 'VALIDATE_TOKEN'
  | 'LOGOUT'
  | 'UPDATE_SETTINGS'
  | 'SYNC_DATA'

export interface Message<T = any> {
  type: MessageType
  payload?: T
}

export interface MessageResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
