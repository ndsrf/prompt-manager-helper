import { useState, useEffect } from "react"
import { Settings as SettingsIcon, Save, RefreshCw, ExternalLink } from "lucide-react"
import type { Settings, AuthState } from "~/lib/types"
import { cn } from "~/lib/utils"
import "~/style.css"

function OptionsPage() {
  const [settings, setSettings] = useState<Settings>({
    apiUrl: 'https://prompteasy.ndsrf.com',
    theme: 'system',
    autoInsert: false,
    showVariablePrompt: true,
    cacheEnabled: true,
    syncInterval: 300000,
  })
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSettings()
    loadAuthState()
  }, [])

  const loadSettings = async () => {
    try {
      const stored = await chrome.storage.local.get('settings')
      if (stored.settings) {
        setSettings(stored.settings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAuthState = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' })
      if (response.success) {
        setAuthState(response.data)
      }
    } catch (error) {
      console.error('Error loading auth state:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        payload: settings
      })

      if (response.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setMessage(null)

    try {
      const response = await chrome.runtime.sendMessage({ type: 'SYNC_DATA' })

      if (response.success) {
        setMessage({ type: 'success', text: 'Synced successfully!' })
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to sync' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sync data' })
    } finally {
      setSyncing(false)
    }
  }

  const openWebApp = () => {
    chrome.tabs.create({ url: settings.apiUrl })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">PromptEasy Settings</h1>
          </div>
          <p className="text-gray-600">Configure your extension preferences</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={cn(
              "mb-6 p-4 rounded-lg border",
              message.type === 'success'
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            )}
          >
            {message.text}
          </div>
        )}

        {/* Account Info */}
        {authState?.isAuthenticated && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {authState.user?.email}
                </span>
              </div>
              {authState.user?.name && (
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {authState.user.name}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={openWebApp}
              className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Open Web App
            </button>
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>

          {/* API URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API URL
            </label>
            <input
              type="url"
              value={settings.apiUrl}
              onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://prompteasy.ndsrf.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              The URL of your PromptEasy server
            </p>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Auto Insert */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Auto Insert
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Automatically insert prompts without confirmation
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoInsert}
              onChange={(e) => setSettings({ ...settings, autoInsert: e.target.checked })}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>

          {/* Show Variable Prompt */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Show Variable Prompt
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Show dialog to fill in variables before inserting
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.showVariablePrompt}
              onChange={(e) => setSettings({ ...settings, showVariablePrompt: e.target.checked })}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>

          {/* Cache Enabled */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enable Cache
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Cache prompts locally for faster access
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.cacheEnabled}
              onChange={(e) => setSettings({ ...settings, cacheEnabled: e.target.checked })}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>

          {/* Sync Interval */}
          {settings.cacheEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sync Interval (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.syncInterval / 60000}
                onChange={(e) => setSettings({
                  ...settings,
                  syncInterval: parseInt(e.target.value) * 60000
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                How often to sync prompts in the background
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>

          {authState?.isAuthenticated && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </>
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>PromptEasy Extension v1.0.0</p>
          <p className="mt-1">
            <a
              href="https://github.com/yourusername/prompteasy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700"
            >
              Documentation
            </a>
            {" · "}
            <a
              href="https://github.com/yourusername/prompteasy/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700"
            >
              Report Issue
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default OptionsPage
