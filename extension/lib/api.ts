import type { Prompt, AuthState } from './types'
import { getAuthState, getSettings, setAuthState } from './storage'

// API Client using tRPC
class ApiClient {
  private baseUrl: string = 'https://prompteasy.ndsrf.com'
  private token: string | null = null

  async initialize() {
    const settings = await getSettings()
    this.baseUrl = settings.apiUrl

    const authState = await getAuthState()
    this.token = authState.token
  }

  private async trpcFetch<T>(
    procedure: string,
    input?: any,
    options: RequestInit = {}
  ): Promise<T> {
    await this.initialize()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const url = `${this.baseUrl}/api/trpc/${procedure}${input ? `?input=${encodeURIComponent(JSON.stringify(input))}` : ''}`

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.result.data as T
  }

  private async trpcMutate<T>(
    procedure: string,
    input: any
  ): Promise<T> {
    await this.initialize()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}/api/trpc/${procedure}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.result.data as T
  }

  // Auth - Extension uses API tokens instead of session cookies
  // User needs to generate a token from the web app and paste it in the extension
  async validateToken(token: string): Promise<AuthState> {
    await this.initialize()
    this.token = token

    try {
      // Try to fetch user info to validate the token
      const user = await this.trpcFetch<{
        id: string
        email: string
        name: string | null
        customInstructions: string | null
      }>('user.me')

      const authState: AuthState = {
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          customInstructions: user.customInstructions,
        },
        token,
      }

      // Save to storage
      await setAuthState(authState)

      return authState
    } catch (error) {
      console.error('[API] Error validating token:', error)
      throw new Error('Invalid or expired token')
    }
  }

  async logout(): Promise<void> {
    this.token = null
  }

  // User settings
  async getUserSettings(): Promise<Record<string, any>> {
    try {
      return await this.trpcFetch<Record<string, any>>('user.getSettings')
    } catch (error) {
      console.error('[API] Error fetching user settings:', error)
      return {}
    }
  }

  // Prompts
  async getPrompts(params?: {
    search?: string
    favorites?: boolean
    limit?: number
  }): Promise<Prompt[]> {
    const response = await this.trpcFetch<{ prompts: Prompt[]; nextCursor?: string }>('prompt.getAll', params)
    return response.prompts
  }

  async getPrompt(id: string): Promise<Prompt> {
    return await this.trpcFetch<Prompt>('prompt.getById', { id })
  }

  async createPrompt(data: {
    title: string
    content: string
    description?: string
    variables?: any[]
    targetLlm?: string
  }): Promise<Prompt> {
    return await this.trpcMutate<Prompt>('prompt.create', data)
  }

  async updatePrompt(id: string, data: Partial<Prompt>): Promise<Prompt> {
    return await this.trpcMutate<Prompt>('prompt.update', { id, ...data })
  }

  async incrementUsage(id: string): Promise<void> {
    await this.trpcMutate('prompt.incrementUsage', { id })
  }

  // AI Improvements
  async improvePrompt(content: string, targetLlm?: string): Promise<{
    improved: string
    suggestions: string[]
    score: number
  }> {
    return await this.trpcMutate('ai.improvePrompt', { content, targetLlm })
  }

  // Selectors - Public endpoint, no auth required
  async getSelectors(): Promise<{
    configs: Array<{
      name: string
      inputSelector: string
      buttonInsertSelector: string
      sendButtonSelector?: string
      version: string
      lastUpdated: string
    }>
    version: string
    lastUpdated: string
  }> {
    // This endpoint doesn't require authentication
    const tempToken = this.token
    this.token = null

    try {
      return await this.trpcFetch('selector.getAll')
    } finally {
      this.token = tempToken
    }
  }
}

export const apiClient = new ApiClient()
