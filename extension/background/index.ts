import type { Message, MessageResponse } from '~/lib/types'
import { apiClient } from '~/lib/api'
import {
  getAuthState,
  setAuthState,
  clearAuthState,
  getCachedPrompts,
  setCachedPrompts,
  getSettings,
  setSettings,
  needsSync,
} from '~/lib/storage'
import { syncThemeFromUserSettings } from '~/lib/theme'

console.log('[Background] Service worker started')

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] Extension installed:', details.reason)

  if (details.reason === 'install') {
    // Open options page on first install
    chrome.runtime.openOptionsPage()
  }
})

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse: (response: MessageResponse) => void) => {
    console.log('[Background] Message received:', message.type)

    // Handle async operations
    handleMessage(message)
      .then((data) => {
        sendResponse({ success: true, data })
      })
      .catch((error) => {
        console.error('[Background] Error handling message:', error)
        sendResponse({ success: false, error: error.message })
      })

    // Return true to indicate async response
    return true
  }
)

// Message handler
async function handleMessage(message: Message): Promise<any> {
  switch (message.type) {
    case 'GET_AUTH_STATE':
      return await getAuthState()

    case 'VALIDATE_TOKEN':
      // Validate extension token
      const { token } = message.payload
      const authState = await apiClient.validateToken(token)
      // Sync prompts and theme after validating token
      await syncPrompts()
      await syncTheme()
      return authState

    case 'LOGOUT':
      await apiClient.logout()
      await clearAuthState()
      return { success: true }

    case 'GET_PROMPTS':
      const { search, favorites, limit, useCache } = message.payload || {}

      // Check if we should use cache
      if (useCache) {
        const cachedPrompts = await getCachedPrompts()
        if (cachedPrompts.length > 0) {
          return filterPrompts(cachedPrompts, { search, favorites, limit })
        }
      }

      // Fetch from API
      const prompts = await apiClient.getPrompts({ search, favorites, limit })
      return prompts

    case 'SAVE_PROMPT':
      const { title, content, description, variables, targetLlm } = message.payload
      const newPrompt = await apiClient.createPrompt({
        title,
        content,
        description,
        variables,
        targetLlm,
      })
      // Update cache
      await syncPrompts()
      return newPrompt

    case 'INSERT_PROMPT':
      const { promptId } = message.payload
      const prompt = await apiClient.getPrompt(promptId)
      // Increment usage count
      await apiClient.incrementUsage(promptId)
      // Update cache
      await syncPrompts()
      return prompt

    case 'IMPROVE_PROMPT':
      const { content: promptContent, targetLlm: llm } = message.payload
      const improvement = await apiClient.improvePrompt(promptContent, llm)
      return improvement

    case 'UPDATE_SETTINGS':
      await setSettings(message.payload)
      return message.payload

    case 'SYNC_DATA':
      await syncPrompts()
      return { success: true, timestamp: new Date().toISOString() }

    default:
      throw new Error(`Unknown message type: ${message.type}`)
  }
}

// Sync prompts from API to cache
async function syncPrompts(): Promise<void> {
  try {
    const authState = await getAuthState()
    if (!authState.isAuthenticated) {
      console.log('[Background] Not authenticated, skipping sync')
      return
    }

    console.log('[Background] Syncing prompts...')
    const prompts = await apiClient.getPrompts({ limit: 100 })
    await setCachedPrompts(prompts)
    console.log('[Background] Synced', prompts.length, 'prompts')
  } catch (error) {
    console.error('[Background] Error syncing prompts:', error)
  }
}

// Sync theme from user settings
async function syncTheme(): Promise<void> {
  try {
    const authState = await getAuthState()
    if (!authState.isAuthenticated) {
      console.log('[Background] Not authenticated, skipping theme sync')
      return
    }

    console.log('[Background] Syncing theme...')
    const userSettings = await apiClient.getUserSettings()
    await syncThemeFromUserSettings(userSettings)
    console.log('[Background] Theme synced successfully')
  } catch (error) {
    console.error('[Background] Error syncing theme:', error)
  }
}

// Filter prompts locally
function filterPrompts(
  prompts: any[],
  filters: {
    search?: string
    favorites?: boolean
    limit?: number
  }
): any[] {
  let filtered = [...prompts]

  if (filters.search) {
    const query = filters.search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query)
    )
  }

  if (filters.favorites) {
    filtered = filtered.filter((p) => p.isFavorite)
  }

  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit)
  }

  return filtered
}

// Auto-sync on interval
setInterval(async () => {
  const shouldSync = await needsSync()
  if (shouldSync) {
    console.log('[Background] Auto-syncing prompts...')
    await syncPrompts()
  }
}, 60000) // Check every minute

// Initial sync
setTimeout(async () => {
  const authState = await getAuthState()
  if (authState.isAuthenticated) {
    await syncPrompts()
    await syncTheme()
  }
}, 5000) // Wait 5 seconds after startup

export {}
