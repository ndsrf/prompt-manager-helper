import type { Settings } from './types'
import { getSettings } from './storage'

export type Theme = 'light' | 'dark' | 'futuristic' | 'system'

// Get system theme preference
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// Apply theme to document
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  // Remove all theme classes
  root.classList.remove('light', 'dark', 'futuristic')

  // Determine the actual theme to apply
  let themeToApply: 'light' | 'dark' | 'futuristic'
  if (theme === 'system') {
    themeToApply = getSystemTheme()
  } else {
    themeToApply = theme
  }

  // Apply the theme class (light is the default, no class needed)
  if (themeToApply !== 'light') {
    root.classList.add(themeToApply)
  }

  console.log('[Theme] Applied theme:', themeToApply)
}

// Initialize theme from settings
export async function initializeTheme(): Promise<void> {
  try {
    const settings = await getSettings()
    applyTheme(settings.theme)

    // Listen for system theme changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', async () => {
        const currentSettings = await getSettings()
        if (currentSettings.theme === 'system') {
          applyTheme('system')
        }
      })
    }
  } catch (error) {
    console.error('[Theme] Error initializing theme:', error)
    // Fallback to light theme
    applyTheme('light')
  }
}

// Sync theme from web app user settings
export async function syncThemeFromUserSettings(userSettings: Record<string, any>): Promise<void> {
  try {
    if (userSettings && userSettings.theme) {
      const theme = userSettings.theme as Theme
      const { getSettings, setSettings } = await import('./storage')
      const settings = await getSettings()

      if (settings.theme !== theme) {
        await setSettings({ ...settings, theme })
        applyTheme(theme)
        console.log('[Theme] Synced theme from user settings:', theme)
      }
    }
  } catch (error) {
    console.error('[Theme] Error syncing theme from user settings:', error)
  }
}
