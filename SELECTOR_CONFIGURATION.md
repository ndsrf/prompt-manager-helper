# LLM Selector Configuration Guide

## Overview

The extension now uses **server-side selector configurations** instead of hardcoded selectors in the extension code. This means you can update HTML selectors for different LLM platforms without rebuilding and redistributing the extension.

## Architecture

### Server Side
- **Location**: `/src/server/api/routers/selector.ts`
- **Endpoint**: `https://prompteasy.ndsrf.com/api/trpc/selector.getAll`
- **Type**: Public endpoint (no authentication required)

### Extension Side
- **Detector**: `/extension/lib/llm-detector.ts` - Detects LLM and uses selectors
- **Cache**: `/extension/lib/selector-cache.ts` - Fetches and caches selectors
- **API Client**: `/extension/lib/api.ts` - Contains `getSelectors()` method

## How It Works

1. **Extension starts** → Initializes selector cache
2. **Cache checks** → Looks for cached selectors in chrome.storage
3. **If cache is old or missing** → Fetches from server API
4. **Server returns** → Current selector configurations
5. **Extension caches** → Saves to chrome.storage for 24 hours
6. **Fallback** → Uses hardcoded selectors if server is unreachable

## Updating Selectors

### Step 1: Edit Server Configuration

Edit the `LLM_SELECTOR_CONFIGS` array in `/src/server/api/routers/selector.ts`:

```typescript
const LLM_SELECTOR_CONFIGS: LLMConfig[] = [
  {
    name: "chatgpt",
    inputSelector: "#prompt-textarea, textarea[placeholder*='Message']",
    buttonInsertSelector: "form button[type='button']",
    sendButtonSelector: "button[data-testid='send-button']",
    version: "1.0.1",  // Increment version
    lastUpdated: "2025-10-24",  // Update date
  },
  // ... other LLMs
]
```

### Step 2: Deploy Server Changes

```bash
# Commit and push changes
git add src/server/api/routers/selector.ts
git commit -m "Update ChatGPT selectors for new UI"
git push

# Deploy to production (your deployment method)
```

### Step 3: Verify Changes

```bash
# Test the endpoint
curl https://prompteasy.ndsrf.com/api/trpc/selector.getAll

# Should return updated selectors
```

### Step 4: Wait for Extension Cache Refresh

- Extensions will automatically fetch new selectors within 24 hours
- Or users can force refresh by clearing extension cache

## Selector Configuration Format

Each LLM configuration has these fields:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | LLM identifier | `"chatgpt"`, `"claude"` |
| `inputSelector` | string | CSS selector for input/textarea | `"#prompt-textarea"` |
| `buttonInsertSelector` | string | CSS selector for button container | `".flex.gap-3"` |
| `sendButtonSelector` | string (optional) | CSS selector for send button | `"button[data-testid='send']"` |
| `version` | string | Configuration version | `"1.0.1"` |
| `lastUpdated` | string | Last update date | `"2025-10-24"` |

## Supported LLM Platforms

Current configurations:

1. **ChatGPT** (`chatgpt`)
   - Domain: `chat.openai.com`, `chatgpt.com`

2. **Claude** (`claude`)
   - Domain: `claude.ai`

3. **Gemini** (`gemini`)
   - Domain: `gemini.google.com`, `bard.google.com`

4. **Copilot** (`copilot`)
   - Domain: `copilot.microsoft.com`

5. **M365 Copilot** (`m365copilot`)
   - Domain: `m365.cloud.microsoft`

6. **Perplexity** (`perplexity`)
   - Domain: `perplexity.ai`

## Adding a New LLM Platform

### 1. Add Server Configuration

```typescript
// In /src/server/api/routers/selector.ts
{
  name: "newllm",
  inputSelector: "textarea[data-testid='input']",
  buttonInsertSelector: ".toolbar",
  sendButtonSelector: "button[aria-label='Send']",
  version: "1.0.0",
  lastUpdated: "2025-10-24",
}
```

### 2. Update Extension Manifest

Edit `/extension/contents/message-handler.ts` and `/extension/contents/prompteasy-injector.tsx`:

```typescript
export const config: PlasmoCSConfig = {
  matches: [
    // ... existing matches
    "https://newllm.com/*"  // Add new domain
  ],
  all_frames: false
}
```

### 3. Update Type Definitions

Edit `/extension/lib/types.ts`:

```typescript
export type DetectedLLM =
  | 'chatgpt'
  | 'claude'
  // ... existing types
  | 'newllm'  // Add new type
```

### 4. Add Hostname Detection

Edit `/extension/lib/llm-detector.ts`:

```typescript
// In detectLLM() function
if (hostname.includes('newllm.com')) {
  return configs.find(c => c.name === 'newllm') || null
}
```

### 5. Add Fallback Configuration

Edit `/extension/lib/selector-cache.ts`:

```typescript
const FALLBACK_CONFIGS: LLMConfig[] = [
  // ... existing fallbacks
  {
    name: 'newllm',
    inputSelector: 'textarea[data-testid="input"]',
    buttonInsertSelector: '.toolbar',
    sendButtonSelector: 'button[aria-label="Send"]',
  },
]
```

## Debugging

### Check Server Response

```bash
curl https://prompteasy.ndsrf.com/api/trpc/selector.getAll | jq
```

### Check Extension Cache

In browser console on LLM page:

```javascript
chrome.storage.local.get(['llm_selectors_cache', 'llm_selectors_version'], (result) => {
  console.log(result)
})
```

### Force Refresh Cache

```javascript
chrome.storage.local.remove(['llm_selectors_cache', 'llm_selectors_version', 'llm_selectors_timestamp'])
```

### Enable Debug Logging

Open extension content script console on LLM page to see:
- `[Selector Cache] ...` - Cache operations
- `[LLM Detector] ...` - Detection and injection
- `[PromptEasy] ...` - Button injection

## Cache Behavior

- **Duration**: 24 hours
- **Storage**: chrome.storage.local
- **Keys**:
  - `llm_selectors_cache` - Array of configs
  - `llm_selectors_version` - Server version
  - `llm_selectors_timestamp` - Cache timestamp

## Fallback Strategy

If server is unreachable:

1. Use cached selectors (if available)
2. Use hardcoded fallback selectors
3. Extension continues to work offline

## Benefits

✅ Update selectors without rebuilding extension
✅ Instant deployment to all users (within 24 hours)
✅ Version tracking and history
✅ Fallback ensures extension always works
✅ No need to redistribute extension files

## Limitations

⚠️ New LLM platforms still require extension update (for manifest/types)
⚠️ Cache refresh takes up to 24 hours
⚠️ Requires server to be accessible

## Future Enhancements

- Admin UI to manage selectors
- Real-time selector testing
- User-reported selector failures
- A/B testing for selector changes
- Multiple selector versions with fallbacks
