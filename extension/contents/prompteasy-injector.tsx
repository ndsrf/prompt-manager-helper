import type { PlasmoCSConfig } from "plasmo"
import { detectLLM, insertTextIntoInput, getCurrentInputText, getButtonInsertPoint } from "~/lib/llm-detector"
import { Book, Sparkles, Save } from "lucide-react"

export const config: PlasmoCSConfig = {
  matches: [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://bard.google.com/*",
    "https://copilot.microsoft.com/*",
    "https://m365.cloud.microsoft/*",
    "https://www.perplexity.ai/*"
  ],
  all_frames: false
}

// Inject PromptEasy buttons into LLM interface
class PromptEasyInjector {
  private llmConfig = detectLLM()
  private container: HTMLDivElement | null = null

  constructor() {
    console.log('[PromptEasy] Content script loaded')
    this.init()
  }

  private init() {
    if (!this.llmConfig) {
      console.log('[PromptEasy] LLM not detected, waiting...')
      // Retry after DOM is loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.retryDetection())
      } else {
        setTimeout(() => this.retryDetection(), 2000)
      }
      return
    }

    console.log('[PromptEasy] Detected LLM:', this.llmConfig.name)
    this.injectButtons()

    // Watch for DOM changes to re-inject if needed
    this.observeDOM()
  }

  private retryDetection() {
    this.llmConfig = detectLLM()
    if (this.llmConfig) {
      this.init()
    }
  }

  private injectButtons() {
    const insertPoint = getButtonInsertPoint(this.llmConfig!)
    if (!insertPoint || document.getElementById('prompteasy-buttons')) {
      return
    }

    // Create button container
    this.container = document.createElement('div')
    this.container.id = 'prompteasy-buttons'
    this.container.className = 'prompteasy-extension-buttons'
    this.container.style.cssText = `
      display: inline-flex;
      gap: 8px;
      align-items: center;
      margin-right: 8px;
    `

    // Create buttons
    const buttons = [
      {
        id: 'prompteasy-insert',
        title: 'Insert Prompt',
        icon: '📚',
        onClick: () => this.handleInsertClick()
      },
      {
        id: 'prompteasy-improve',
        title: 'Improve with AI',
        icon: '✨',
        onClick: () => this.handleImproveClick()
      },
      {
        id: 'prompteasy-save',
        title: 'Save to Library',
        icon: '💾',
        onClick: () => this.handleSaveClick()
      }
    ]

    buttons.forEach(btn => {
      const button = this.createButton(btn)
      this.container!.appendChild(button)
    })

    // Insert buttons
    insertPoint.insertBefore(this.container, insertPoint.firstChild)
    console.log('[PromptEasy] Buttons injected')
  }

  private createButton(config: {
    id: string
    title: string
    icon: string
    onClick: () => void
  }) {
    const button = document.createElement('button')
    button.id = config.id
    button.title = config.title
    button.textContent = config.icon
    button.style.cssText = `
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    `

    button.onmouseover = () => {
      button.style.background = '#4f46e5'
      button.style.transform = 'scale(1.05)'
    }

    button.onmouseout = () => {
      button.style.background = '#6366f1'
      button.style.transform = 'scale(1)'
    }

    button.onclick = (e) => {
      e.preventDefault()
      config.onClick()
    }

    return button
  }

  private handleInsertClick() {
    console.log('[PromptEasy] Insert button clicked')
    // Send message to open popup or show modal
    chrome.runtime.sendMessage({
      type: 'SHOW_PROMPT_PICKER',
      payload: { source: 'content_script' }
    })
  }

  private async handleImproveClick() {
    console.log('[PromptEasy] Improve button clicked')

    if (!this.llmConfig) return

    const currentText = getCurrentInputText(this.llmConfig)
    if (!currentText) {
      alert('Please enter some text first')
      return
    }

    // Show loading state
    const improveBtn = document.getElementById('prompteasy-improve')
    if (improveBtn) {
      improveBtn.textContent = '⏳'
      improveBtn.setAttribute('disabled', 'true')
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'IMPROVE_PROMPT',
        payload: {
          content: currentText,
          targetLlm: this.llmConfig.name
        }
      })

      if (response.success && response.data) {
        // Insert improved text
        insertTextIntoInput(this.llmConfig, response.data.improved)
      } else {
        alert('Failed to improve prompt: ' + response.error)
      }
    } catch (error) {
      console.error('[PromptEasy] Error improving prompt:', error)
      alert('Error improving prompt. Please try again.')
    } finally {
      // Reset button
      if (improveBtn) {
        improveBtn.textContent = '✨'
        improveBtn.removeAttribute('disabled')
      }
    }
  }

  private async handleSaveClick() {
    console.log('[PromptEasy] Save button clicked')

    if (!this.llmConfig) return

    const currentText = getCurrentInputText(this.llmConfig)
    if (!currentText) {
      alert('Please enter some text first')
      return
    }

    const title = prompt('Enter a title for this prompt:')
    if (!title) return

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_PROMPT',
        payload: {
          title,
          content: currentText,
          targetLlm: this.llmConfig.name
        }
      })

      if (response.success) {
        // Show success message
        this.showToast('Prompt saved successfully!', 'success')
      } else {
        alert('Failed to save prompt: ' + response.error)
      }
    } catch (error) {
      console.error('[PromptEasy] Error saving prompt:', error)
      alert('Error saving prompt. Please try again.')
    }
  }

  private showToast(message: string, type: 'success' | 'error') {
    const toast = document.createElement('div')
    toast.textContent = message
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out'
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  private observeDOM() {
    const observer = new MutationObserver((mutations) => {
      // Check if our buttons are still there
      if (!document.getElementById('prompteasy-buttons')) {
        console.log('[PromptEasy] Buttons removed, re-injecting...')
        this.injectButtons()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }
}

// Initialize
new PromptEasyInjector()

export {}
