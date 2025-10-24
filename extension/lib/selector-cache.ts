import { apiClient } from './api'
import type { LLMConfig } from './llm-detector'

const CACHE_KEY = 'llm_selectors_cache'
const CACHE_VERSION_KEY = 'llm_selectors_version'
const CACHE_TIMESTAMP_KEY = 'llm_selectors_timestamp'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Fallback configurations if server is unreachable
const FALLBACK_CONFIGS: LLMConfig[] = [
  {
    name: 'chatgpt',
    inputSelector: '#prompt-textarea, textarea[placeholder*="Message"], div[contenteditable="true"][data-id]',
    buttonInsertSelector: 'form button[type="button"], .flex.gap-3.items-center',
    sendButtonSelector: 'button[data-testid="send-button"], button[data-testid="fruitjuice-send-button"]',
  },
  {
    name: 'claude',
    inputSelector: 'div[contenteditable="true"][role="textbox"]',
    buttonInsertSelector: '.flex.items-center.gap-2',
    sendButtonSelector: 'button[aria-label="Send Message"]',
  },
  {
    name: 'gemini',
    inputSelector: '.ql-editor[contenteditable="true"]',
    buttonInsertSelector: '.action-wrapper',
    sendButtonSelector: 'button[aria-label="Send message"]',
  },
  {
    name: 'copilot',
    inputSelector: '#userInput, textarea[placeholder*="Copilot"], textarea[data-testid="composer-input"], textarea[aria-label="Ask me anything..."]',
    buttonInsertSelector: '.controls',
    sendButtonSelector: 'button[aria-label="Submit"]',
  },
  {
    name: 'm365copilot',
    inputSelector: '#ms-searchux-input-0, input[role="combobox"][id*="searchux"]',
    buttonInsertSelector: 'body',
    sendButtonSelector: 'button[aria-label*="Search"], button[type="submit"]',
  },
  {
    name: 'perplexity',
    inputSelector: 'textarea[placeholder*="Ask anything"]',
    buttonInsertSelector: '.relative.flex',
    sendButtonSelector: 'button[aria-label="Submit"]',
  },
]

class SelectorCache {
  private configs: LLMConfig[] | null = null
  private initialized: boolean = false

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

    // If we still don't have configs, use fallback
    if (!this.configs || this.configs.length === 0) {
      console.log('[Selector Cache] Using fallback configurations')
      this.configs = FALLBACK_CONFIGS
    }

    this.initialized = true
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
      } else {
        console.warn('[Selector Cache] Server returned no configurations')
      }
    } catch (error) {
      console.error('[Selector Cache] Error fetching from server:', error)
      // Don't throw - we'll use cached or fallback configs
    }
  }

  /**
   * Get all configurations
   */
  async getConfigs(): Promise<LLMConfig[]> {
    if (!this.initialized) {
      await this.initialize()
    }

    return this.configs || FALLBACK_CONFIGS
  }

  /**
   * Get configuration by name
   */
  async getConfig(name: string): Promise<LLMConfig | null> {
    const configs = await this.getConfigs()
    return configs.find(c => c.name === name) || null
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
