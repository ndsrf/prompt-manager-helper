import { apiClient } from './api'
import type { LLMConfig } from './llm-detector'

const CACHE_KEY = 'llm_selectors_cache'
const CACHE_VERSION_KEY = 'llm_selectors_version'
const CACHE_TIMESTAMP_KEY = 'llm_selectors_timestamp'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

class SelectorCache {
  private configs: LLMConfig[] | null = null
  private initialized: boolean = false
  private serverError: Error | null = null

  /**
   * Initialize the cache by fetching from storage or server
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    console.log('[Selector Cache] Initializing...')

    // Try to load from chrome.storage first
    const cached = await this.loadFromStorage()

    if (cached) {
      this.configs = cached
      console.log('[Selector Cache] Loaded from storage:', cached.length, 'configs')
    }

    // Check if we need to refresh from server
    const needsRefresh = await this.needsRefresh()

    if (needsRefresh) {
      console.log('[Selector Cache] Cache expired or missing, fetching from server...')
      await this.fetchFromServer()
    }

    // If we still don't have configs, throw error
    if (!this.configs || this.configs.length === 0) {
      const errorMsg = 'Server is unavailable. Please check your internet connection and try again later.'
      console.error('[Selector Cache]', errorMsg)
      this.serverError = new Error(errorMsg)
      throw this.serverError
    }

    this.initialized = true
    this.serverError = null
  }

  /**
   * Check if cache needs refresh
   */
  private async needsRefresh(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get([CACHE_TIMESTAMP_KEY])
      const timestamp = result[CACHE_TIMESTAMP_KEY]

      if (!timestamp) return true

      const age = Date.now() - timestamp
      return age > CACHE_DURATION
    } catch (error) {
      console.error('[Selector Cache] Error checking cache age:', error)
      return true
    }
  }

  /**
   * Load configurations from chrome.storage
   */
  private async loadFromStorage(): Promise<LLMConfig[] | null> {
    try {
      const result = await chrome.storage.local.get([CACHE_KEY])
      const cached = result[CACHE_KEY]

      if (cached && Array.isArray(cached)) {
        return cached as LLMConfig[]
      }

      return null
    } catch (error) {
      console.error('[Selector Cache] Error loading from storage:', error)
      return null
    }
  }

  /**
   * Fetch configurations from server and cache them
   */
  async fetchFromServer(): Promise<void> {
    try {
      console.log('[Selector Cache] Fetching from server...')
      const response = await apiClient.getSelectors()

      if (response && response.configs && response.configs.length > 0) {
        // Convert server configs to LLMConfig format
        this.configs = response.configs.map(config => ({
          name: config.name as any,
          inputSelector: config.inputSelector,
          buttonInsertSelector: config.buttonInsertSelector,
          sendButtonSelector: config.sendButtonSelector,
        }))

        // Save to storage
        await chrome.storage.local.set({
          [CACHE_KEY]: this.configs,
          [CACHE_VERSION_KEY]: response.version,
          [CACHE_TIMESTAMP_KEY]: Date.now(),
        })

        console.log('[Selector Cache] Fetched and cached', this.configs.length, 'configs from server')
        this.serverError = null
      } else {
        const errorMsg = 'Server returned no configurations'
        console.error('[Selector Cache]', errorMsg)
        this.serverError = new Error(errorMsg)
      }
    } catch (error) {
      console.error('[Selector Cache] Error fetching from server:', error)
      this.serverError = error instanceof Error ? error : new Error(String(error))
      // If we don't have cached configs, this is a critical error
      if (!this.configs || this.configs.length === 0) {
        throw this.serverError
      }
    }
  }

  /**
   * Get all configurations
   * Throws error if server is unavailable and no cached configs exist
   */
  async getConfigs(): Promise<LLMConfig[]> {
    if (!this.initialized) {
      await this.initialize()
    }

    if (!this.configs || this.configs.length === 0) {
      throw new Error('Server is unavailable. Please check your internet connection and try again later.')
    }

    return this.configs
  }

  /**
   * Get configuration by name
   * Throws error if server is unavailable and no cached configs exist
   */
  async getConfig(name: string): Promise<LLMConfig | null> {
    const configs = await this.getConfigs()
    return configs.find(c => c.name === name) || null
  }

  /**
   * Check if there's a server error
   */
  hasError(): boolean {
    return this.serverError !== null
  }

  /**
   * Get the server error if any
   */
  getError(): Error | null {
    return this.serverError
  }

  /**
   * Force refresh from server
   */
  async refresh(): Promise<void> {
    console.log('[Selector Cache] Force refreshing from server...')
    await this.fetchFromServer()
  }

  /**
   * Clear cache
   */
  async clear(): Promise<void> {
    this.configs = null
    this.initialized = false
    await chrome.storage.local.remove([CACHE_KEY, CACHE_VERSION_KEY, CACHE_TIMESTAMP_KEY])
    console.log('[Selector Cache] Cache cleared')
  }
}

// Export singleton instance
export const selectorCache = new SelectorCache()
