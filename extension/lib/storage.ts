import type { AuthState, Prompt, Settings } from './types'

// Storage keys
const STORAGE_KEYS = {
  AUTH: 'auth_state',
  SETTINGS: 'settings',
  CACHED_PROMPTS: 'cached_prompts',
  LAST_SYNC: 'last_sync',
} as const

// Get data from chrome.storage
export async function getStorageData<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(key)
    return result[key] || null
  } catch (error) {
    console.error('[Storage] Error getting data:', error)
    return null
  }
}

// Set data in chrome.storage
export async function setStorageData<T>(key: string, value: T): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: value })
  } catch (error) {
    console.error('[Storage] Error setting data:', error)
    throw error
  }
}

// Remove data from chrome.storage
export async function removeStorageData(key: string): Promise<void> {
  try {
    await chrome.storage.local.remove(key)
  } catch (error) {
    console.error('[Storage] Error removing data:', error)
    throw error
  }
}

// Clear all storage
export async function clearStorage(): Promise<void> {
  try {
    await chrome.storage.local.clear()
  } catch (error) {
    console.error('[Storage] Error clearing storage:', error)
    throw error
  }
}

// Auth state management
export async function getAuthState(): Promise<AuthState> {
  const authState = await getStorageData<AuthState>(STORAGE_KEYS.AUTH)
  return authState || {
    isAuthenticated: false,
    user: null,
    token: null,
  }
}

export async function setAuthState(authState: AuthState): Promise<void> {
  await setStorageData(STORAGE_KEYS.AUTH, authState)
}

export async function clearAuthState(): Promise<void> {
  await removeStorageData(STORAGE_KEYS.AUTH)
}

// Settings management
export async function getSettings(): Promise<Settings> {
  const settings = await getStorageData<Settings>(STORAGE_KEYS.SETTINGS)
  return settings || {
    apiUrl: 'https://prompteasy.ndsrf.com',
    theme: 'system',
    autoInsert: false,
    showVariablePrompt: true,
    cacheEnabled: true,
    syncInterval: 300000,
  }
}

export async function setSettings(settings: Settings): Promise<void> {
  await setStorageData(STORAGE_KEYS.SETTINGS, settings)
}

// Cached prompts management
export async function getCachedPrompts(): Promise<Prompt[]> {
  const prompts = await getStorageData<Prompt[]>(STORAGE_KEYS.CACHED_PROMPTS)
  return prompts || []
}

export async function setCachedPrompts(prompts: Prompt[]): Promise<void> {
  await setStorageData(STORAGE_KEYS.CACHED_PROMPTS, prompts)
  await setStorageData(STORAGE_KEYS.LAST_SYNC, new Date().toISOString())
}

export async function getLastSyncTime(): Promise<Date | null> {
  const lastSync = await getStorageData<string>(STORAGE_KEYS.LAST_SYNC)
  return lastSync ? new Date(lastSync) : null
}

// Check if sync is needed
export async function needsSync(): Promise<boolean> {
  const settings = await getSettings()
  if (!settings.cacheEnabled) return false

  const lastSync = await getLastSyncTime()
  if (!lastSync) return true

  const now = Date.now()
  const lastSyncTime = lastSync.getTime()
  return now - lastSyncTime > settings.syncInterval
}
