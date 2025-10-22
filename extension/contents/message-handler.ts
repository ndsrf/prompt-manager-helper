import { detectLLM, insertTextIntoInput } from "~/lib/llm-detector"
import type { Prompt, Variable } from "~/lib/types"
import { substituteVariables } from "~/components/VariableDialog"

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content] Message received:', message.type)

  if (message.type === 'INSERT_PROMPT') {
    handleInsertPrompt(message.payload.prompt)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }))
    return true
  }

  return false
})

async function handleInsertPrompt(prompt: Prompt) {
  const llmConfig = detectLLM()
  if (!llmConfig) {
    throw new Error('LLM not detected. Make sure you are on a supported page.')
  }

  let content = prompt.content

  // If prompt has variables, show dialog to fill them in
  if (prompt.variables && prompt.variables.length > 0) {
    const values = await showVariableDialog(prompt.variables)
    if (!values) {
      // User cancelled
      return
    }
    content = substituteVariables(content, values)
  }

  // Insert the prompt
  const success = insertTextIntoInput(llmConfig, content)
  if (!success) {
    throw new Error('Failed to insert prompt into input field')
  }
}

function showVariableDialog(variables: Variable[]): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    // Create a simple modal dialog for variable input
    const dialog = createVariableDialog(variables, (values) => {
      resolve(values)
      dialog.remove()
    }, () => {
      resolve(null)
      dialog.remove()
    })

    document.body.appendChild(dialog)
  })
}

function createVariableDialog(
  variables: Variable[],
  onSubmit: (values: Record<string, string>) => void,
  onCancel: () => void
): HTMLElement {
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    padding: 16px;
  `

  const dialog = document.createElement('div')
  dialog.style.cssText = `
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `

  // Header
  const header = document.createElement('div')
  header.style.cssText = `
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `
  header.innerHTML = `
    <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Fill in Variables</h2>
    <button id="prompteasy-close" style="padding: 4px; border: none; background: transparent; cursor: pointer; color: #6b7280; font-size: 24px; line-height: 1;">×</button>
  `

  // Form
  const form = document.createElement('form')
  form.style.cssText = `
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  `

  const values: Record<string, string> = {}

  variables.forEach((variable, index) => {
    const field = document.createElement('div')
    field.style.cssText = `margin-bottom: ${index < variables.length - 1 ? '16px' : '0'};`

    const label = document.createElement('label')
    label.textContent = variable.name
    label.style.cssText = `
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 4px;
    `

    let input: HTMLInputElement | HTMLSelectElement

    if (variable.type === 'select' && variable.options) {
      input = document.createElement('select')
      const defaultOption = document.createElement('option')
      defaultOption.value = ''
      defaultOption.textContent = 'Select...'
      input.appendChild(defaultOption)

      variable.options.forEach(option => {
        const opt = document.createElement('option')
        opt.value = option
        opt.textContent = option
        input.appendChild(opt)
      })
    } else {
      input = document.createElement('input')
      input.type = variable.type === 'number' ? 'number' : 'text'
      input.placeholder = variable.default || `Enter ${variable.name}...`
    }

    input.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      box-sizing: border-box;
    `

    if (variable.default) {
      input.value = variable.default
    }

    values[variable.name] = variable.default || ''
    input.addEventListener('input', (e) => {
      values[variable.name] = (e.target as HTMLInputElement).value
    })

    field.appendChild(label)
    field.appendChild(input)
    form.appendChild(field)
  })

  // Footer
  const footer = document.createElement('div')
  footer.style.cssText = `
    padding: 20px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
  `

  const cancelBtn = document.createElement('button')
  cancelBtn.type = 'button'
  cancelBtn.textContent = 'Cancel'
  cancelBtn.style.cssText = `
    padding: 8px 16px;
    border: none;
    background: transparent;
    color: #374151;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.2s;
  `
  cancelBtn.onmouseover = () => cancelBtn.style.background = '#f3f4f6'
  cancelBtn.onmouseout = () => cancelBtn.style.background = 'transparent'
  cancelBtn.onclick = onCancel

  const submitBtn = document.createElement('button')
  submitBtn.type = 'submit'
  submitBtn.textContent = 'Insert'
  submitBtn.style.cssText = `
    padding: 8px 16px;
    border: none;
    background: #6366f1;
    color: white;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: background 0.2s;
  `
  submitBtn.onmouseover = () => submitBtn.style.background = '#4f46e5'
  submitBtn.onmouseout = () => submitBtn.style.background = '#6366f1'

  footer.appendChild(cancelBtn)
  footer.appendChild(submitBtn)

  // Assemble
  dialog.appendChild(header)
  dialog.appendChild(form)
  dialog.appendChild(footer)
  overlay.appendChild(dialog)

  // Event handlers
  form.onsubmit = (e) => {
    e.preventDefault()
    onSubmit(values)
  }

  header.querySelector('#prompteasy-close')!.addEventListener('click', onCancel)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      onCancel()
    }
  })

  return overlay
}

export {}
