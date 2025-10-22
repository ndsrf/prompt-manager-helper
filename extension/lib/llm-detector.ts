import type { DetectedLLM } from './types'

export interface LLMConfig {
  name: DetectedLLM
  inputSelector: string
  buttonInsertSelector: string
  sendButtonSelector?: string
}

// LLM detection configurations
const LLM_CONFIGS: LLMConfig[] = [
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

export function detectLLM(): LLMConfig | null {
  const hostname = window.location.hostname

  // Check hostname first
  if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
    return LLM_CONFIGS.find(c => c.name === 'chatgpt') || null
  }
  if (hostname.includes('claude.ai')) {
    return LLM_CONFIGS.find(c => c.name === 'claude') || null
  }
  if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) {
    return LLM_CONFIGS.find(c => c.name === 'gemini') || null
  }
  if (hostname.includes('m365.cloud.microsoft')) {
    return LLM_CONFIGS.find(c => c.name === 'm365copilot') || null
  }
  if (hostname.includes('copilot.microsoft.com')) {
    return LLM_CONFIGS.find(c => c.name === 'copilot') || null
  }
  if (hostname.includes('perplexity.ai')) {
    return LLM_CONFIGS.find(c => c.name === 'perplexity') || null
  }

  // Try to detect by checking for input elements
  for (const config of LLM_CONFIGS) {
    const input = document.querySelector(config.inputSelector)
    if (input) {
      return config
    }
  }

  return null
}

export function getInputElement(config: LLMConfig): HTMLElement | null {
  return document.querySelector(config.inputSelector) as HTMLElement
}

export function getButtonInsertPoint(config: LLMConfig): HTMLElement | null {
  return document.querySelector(config.buttonInsertSelector) as HTMLElement
}

export function getSendButton(config: LLMConfig): HTMLButtonElement | null {
  if (!config.sendButtonSelector) return null
  return document.querySelector(config.sendButtonSelector) as HTMLButtonElement
}

export function insertTextIntoInput(config: LLMConfig, text: string): boolean {
  const input = getInputElement(config)
  if (!input) {
    console.error('[LLM Detector] Input element not found using selector:', config.inputSelector)
    return false
  }

  console.log('[LLM Detector] Inserting text into input:', input.tagName, input.className)

  // For textarea elements
  if (input instanceof HTMLTextAreaElement) {
    input.value = text
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.focus()
    console.log('[LLM Detector] Inserted into textarea')
    return true
  }

  // For regular input elements
  if (input instanceof HTMLInputElement) {
    input.value = text
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))

    // Also try to trigger InputEvent for React apps
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text
    })
    input.dispatchEvent(inputEvent)

    input.focus()
    console.log('[LLM Detector] Inserted into input element')
    return true
  }

  // For contenteditable elements
  if (input.isContentEditable) {
    // Use innerHTML for better formatting support
    const paragraph = document.createElement('p')
    paragraph.textContent = text
    input.innerHTML = ''
    input.appendChild(paragraph)

    // Trigger input events
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))

    // Also try to trigger InputEvent for React apps
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text
    })
    input.dispatchEvent(inputEvent)

    // Set cursor to end
    const range = document.createRange()
    const sel = window.getSelection()
    range.selectNodeContents(input)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
    input.focus()
    console.log('[LLM Detector] Inserted into contenteditable')
    return true
  }

  console.error('[LLM Detector] Unknown input type:', input)
  return false
}

export function getCurrentInputText(config: LLMConfig): string {
  const input = getInputElement(config)
  if (!input) return ''

  if (input instanceof HTMLTextAreaElement) {
    return input.value
  }

  if (input instanceof HTMLInputElement) {
    return input.value
  }

  if (input.isContentEditable) {
    return input.textContent || ''
  }

  return ''
}
