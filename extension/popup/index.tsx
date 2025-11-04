import { useState, useEffect } from "react"
import { Search, Star, Settings, LogOut, Plus, Loader2, Copy, Check, ThumbsUp } from "lucide-react"
import type { Prompt, AuthState } from "~/lib/types"
import { cn } from "~/lib/utils"
import { getAuthState } from "~/lib/storage"
import "~/style.css"

function IndexPopup() {
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  useEffect(() => {
    loadAuthState()
  }, [])

  useEffect(() => {
    if (authState?.isAuthenticated) {
      loadPrompts()
    }
  }, [authState, search, showFavoritesOnly])

  const loadAuthState = async () => {
    try {
      console.log('[Popup] Loading auth state...')
      const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' })
      console.log('[Popup] Auth state response:', response)
      if (response.success) {
        setAuthState(response.data)
      } else {
        setError(response.error || 'Failed to load auth state')
      }
    } catch (error) {
      console.error('[Popup] Error loading auth state:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const loadPrompts = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('[Popup] Loading prompts...')
      const response = await chrome.runtime.sendMessage({
        type: 'GET_PROMPTS',
        payload: {
          search: search || undefined,
          favorites: showFavoritesOnly || undefined,
          limit: 50,
          useCache: true
        }
      })

      console.log('[Popup] Prompts response:', response)
      if (response.success) {
        setPrompts(Array.isArray(response.data) ? response.data : [])
      } else {
        setError(response.error || 'Failed to load prompts')
      }
    } catch (error) {
      console.error('[Popup] Error loading prompts:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'LOGOUT' })
      setAuthState(null)
      setPrompts([])
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handlePromptClick = async (prompt: Prompt) => {
    try {
      console.log('[Popup] Prompt clicked:', prompt.title)

      // Track usage FIRST before attempting insertion
      // This ensures usage is recorded even if insertion fails
      try {
        await chrome.runtime.sendMessage({
          type: 'INSERT_PROMPT',
          payload: { promptId: prompt.id }
        })
        console.log('[Popup] Usage tracked for prompt:', prompt.id)
      } catch (usageError) {
        console.error('[Popup] Failed to track usage (continuing anyway):', usageError)
        // Don't fail the operation if usage tracking fails
      }

      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      console.log('[Popup] Active tab:', tab.url, 'Tab ID:', tab.id)

      if (!tab.id) {
        alert('Could not find active tab')
        return
      }

      // Send message to content script to insert prompt
      console.log('[Popup] Sending INSERT_PROMPT message to tab')
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'INSERT_PROMPT',
        payload: { prompt }
      })
      console.log('[Popup] Response from content script:', response)

      // Close popup
      window.close()
    } catch (error) {
      console.error('[Popup] Error inserting prompt:', error)
      alert(`Failed to insert prompt: ${error instanceof Error ? error.message : 'Unknown error'}\n\nMake sure you are on a supported LLM page (ChatGPT, Claude, Gemini, etc.)`)
    }
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  const openWebApp = () => {
    chrome.tabs.create({ url: 'https://prompteasy.ndsrf.com/library' })
  }

  if (loading && !authState) {
    return (
      <div className="w-[400px] h-[500px] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !authState) {
    return (
      <div className="w-[400px] h-[500px] flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={loadAuthState}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!authState?.isAuthenticated) {
    return <LoginView onLogin={loadAuthState} />
  }

  return (
    <div className="w-[400px] h-[500px] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-gray-900">PromptEasy</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={openOptions}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              showFavoritesOnly
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <Star className="w-4 h-4" />
            Favorites
          </button>
        </div>
      </div>

      {/* Prompt List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={loadPrompts}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No prompts found</p>
            <button
              onClick={openWebApp}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Prompt
            </button>
          </div>
        ) : (
          prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onClick={() => handlePromptClick(prompt)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-3">
        <button
          onClick={openWebApp}
          className="w-full px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          Open Web App
        </button>
      </div>
    </div>
  )
}

function PromptCard({ prompt, onClick }: { prompt: Prompt; onClick: () => void }) {
  const [copied, setCopied] = useState(false)
  const [markedSuccess, setMarkedSuccess] = useState(false)

  const handleCopyClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent onClick

    try {
      let content = prompt.content

      // Apply custom instructions if enabled for this prompt
      if (prompt.applyCustomInstructions !== false) {
        const authState = await getAuthState()
        const customInstructions = authState?.user?.customInstructions

        if (customInstructions && customInstructions.trim()) {
          // Prepend custom instructions to the prompt content
          content = `${customInstructions.trim()}\n\n---\n\n${content}`
          console.log('[Popup] Applied custom instructions to copied prompt')
        }
      }

      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      // Track usage for copy action
      try {
        await chrome.runtime.sendMessage({
          type: 'COPY_PROMPT',
          payload: { promptId: prompt.id }
        })
      } catch (error) {
        console.error('[Popup] Failed to record copy usage:', error)
        // Don't disrupt the copy action
      }
    } catch (error) {
      console.error('Failed to copy prompt:', error)
    }
  }

  const handleMarkSuccessClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent onClick

    try {
      await chrome.runtime.sendMessage({
        type: 'MARK_SUCCESS',
        payload: { promptId: prompt.id }
      })
      setMarkedSuccess(true)
      setTimeout(() => setMarkedSuccess(false), 2000)
    } catch (error) {
      console.error('[Popup] Failed to mark prompt as successful:', error)
    }
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-medium text-gray-900 text-sm">{prompt.title}</h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleCopyClick}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Copy prompt to clipboard"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
          <button
            onClick={handleMarkSuccessClick}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Mark as successful"
          >
            {markedSuccess ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <ThumbsUp className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
          {prompt.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
        </div>
      </div>
      {prompt.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{prompt.description}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {prompt.targetLlm && (
          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
            {prompt.targetLlm}
          </span>
        )}
        {prompt.tags.slice(0, 2).map((tag) => (
          <span
            key={tag.id}
            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
          >
            {tag.name}
          </span>
        ))}
        {prompt.tags.length > 2 && (
          <span className="text-xs text-gray-400">+{prompt.tags.length - 2}</span>
        )}
      </div>
    </button>
  )
}

function LoginView({ onLogin }: { onLogin: () => void }) {
  const [token, setToken] = useState("")
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState("")

  const handleValidateToken = async () => {
    if (!token.trim()) {
      setError("Please enter a token")
      return
    }

    setValidating(true)
    setError("")

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'VALIDATE_TOKEN',
        payload: { token: token.trim() }
      })

      if (response.success && response.data?.isAuthenticated) {
        onLogin()
      } else {
        setError(response.error || "Invalid or expired token")
      }
    } catch (error) {
      console.error('Error validating token:', error)
      setError("Failed to validate token. Please try again.")
    } finally {
      setValidating(false)
    }
  }

  const openProfile = () => {
    chrome.tabs.create({ url: 'https://prompteasy.ndsrf.com/profile' })
  }

  return (
    <div className="w-[400px] h-[500px] flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">PromptEasy</h1>
          <p className="text-sm text-gray-600">
            Connect your extension to access your prompts
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              Extension Token
            </label>
            <textarea
              id="token"
              value={token}
              onChange={(e) => {
                setToken(e.target.value)
                setError("")
              }}
              placeholder="Paste your extension token here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono resize-none"
              rows={3}
              disabled={validating}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            onClick={handleValidateToken}
            disabled={validating || !token.trim()}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {validating && <Loader2 className="w-4 h-4 animate-spin" />}
            {validating ? 'Validating...' : 'Connect Extension'}
          </button>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-3">
              Don&apos;t have a token yet? Generate one in your profile:
            </p>
            <button
              onClick={openProfile}
              className="w-full px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors border border-indigo-200 rounded-lg hover:bg-indigo-50"
            >
              Open Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
