# PromptEasy Extension Setup Guide

Complete guide to set up, develop, and build the PromptEasy browser extension.

## Prerequisites

- Node.js 20.x or higher
- pnpm 8.x or higher
- Chrome or Edge browser for testing

## Initial Setup

### 1. Install Dependencies

```bash
cd extension
pnpm install
```

This will install all required dependencies including:
- Plasmo framework for extension development
- React and React DOM
- TypeScript
- Tailwind CSS
- Lucide icons
- Zod for validation

### 2. Configure API URL

The extension needs to connect to your PromptEasy web application. By default, it expects the server at `http://localhost:3000`.

To change this:
1. Open the extension options after building
2. Update the "API URL" field
3. Save settings

## Development

### Start Development Server

```bash
pnpm dev
```

This starts the Plasmo development server with:
- Hot module reloading
- Automatic rebuilds on file changes
- Source maps for debugging

The built extension will be in `build/chrome-mv3-dev/`.

### Load Extension in Browser

#### Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select `build/chrome-mv3-dev` directory
5. Pin the extension to toolbar for easy access

#### Edge

1. Open `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `build/chrome-mv3-dev` directory

### Development Workflow

1. Make changes to source files
2. Plasmo automatically rebuilds
3. Click the reload icon in browser extension management
4. Test your changes

## Project Structure

```
extension/
├── background/
│   └── index.ts              # Service worker (background script)
├── contents/
│   ├── prompteasy-injector.tsx  # Main content script
│   └── message-handler.ts    # Message handling for content scripts
├── popup/
│   └── index.tsx             # Extension popup UI
├── options/
│   └── index.tsx             # Settings/options page
├── components/
│   └── VariableDialog.tsx    # Variable substitution dialog
├── lib/
│   ├── api.ts                # API client for backend communication
│   ├── storage.ts            # Chrome storage utilities
│   ├── types.ts              # TypeScript type definitions
│   ├── utils.ts              # Utility functions
│   └── llm-detector.ts       # LLM page detection and DOM manipulation
├── assets/
│   └── icon.svg              # Extension icon
├── package.json.manifest     # Chrome extension manifest
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── style.css                 # Global styles
```

## Building for Production

### Chrome

```bash
pnpm build:chrome
```

Output: `build/chrome-mv3-prod/`

### Edge

```bash
pnpm build:edge
```

Output: `build/edge-mv3-prod/`

### Package for Distribution

```bash
pnpm package
```

This creates a ZIP file ready for upload to:
- Chrome Web Store
- Microsoft Edge Add-ons

## Testing

### Manual Testing Checklist

1. **Authentication**
   - [ ] Login with email/password
   - [ ] Login persists across browser restarts
   - [ ] Logout works correctly

2. **Popup**
   - [ ] Prompts load and display correctly
   - [ ] Search filters prompts
   - [ ] Favorites filter works
   - [ ] Clicking prompt inserts it

3. **Content Scripts (test on each LLM)**
   - [ ] Buttons appear on ChatGPT
   - [ ] Buttons appear on Claude
   - [ ] Buttons appear on Gemini
   - [ ] Insert prompt works
   - [ ] Improve prompt works
   - [ ] Save prompt works

4. **Variable Substitution**
   - [ ] Dialog appears for prompts with variables
   - [ ] Text input works
   - [ ] Number input works
   - [ ] Select dropdown works
   - [ ] Variables are substituted correctly

5. **Settings**
   - [ ] API URL can be changed
   - [ ] Settings persist
   - [ ] Sync works manually
   - [ ] Auto-sync works

6. **Offline Mode**
   - [ ] Cached prompts load when offline
   - [ ] Syncs when back online

### Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Chrome (latest - 1)
- [ ] Edge (latest)
- [ ] Edge (latest - 1)

## Debugging

### View Extension Logs

**Background Script:**
1. Go to `chrome://extensions/`
2. Click "Inspect views: service worker"
3. Console opens with background script logs

**Popup:**
1. Right-click extension icon
2. Select "Inspect popup"

**Content Scripts:**
1. Open DevTools on LLM page (F12)
2. Console shows content script logs
3. Look for `[PromptEasy]` or `[Content]` prefixes

### Common Issues

**Extension not detecting LLM:**
- Check if URL is in manifest's `host_permissions`
- Verify selectors in `lib/llm-detector.ts` are current
- LLM may have changed their DOM structure

**API calls failing:**
- Check API URL in settings
- Verify backend is running
- Check network tab for CORS issues
- Ensure authentication token is valid

**Prompts not syncing:**
- Check if logged in
- Verify sync interval in settings
- Check background script logs for errors

## Manifest Configuration

Key parts of the manifest (`package.json.manifest`):

### Permissions

```json
"permissions": [
  "storage",      // Chrome storage API
  "activeTab",    // Access to current tab
  "scripting"     // Script injection
]
```

### Host Permissions

```json
"host_permissions": [
  "https://chat.openai.com/*",
  "https://claude.ai/*",
  // ... other LLMs
]
```

Add new LLMs by adding their URLs here.

### Content Scripts

```json
"content_scripts": [{
  "matches": ["https://chat.openai.com/*", ...],
  "js": ["content.js"],
  "run_at": "document_end"
}]
```

## Adding Support for New LLMs

1. **Add URL to manifest** (`package.json.manifest`):
   ```json
   "host_permissions": [
     "https://newllm.com/*"
   ],
   "content_scripts": [{
     "matches": ["https://newllm.com/*"]
   }]
   ```

2. **Add detection config** (`lib/llm-detector.ts`):
   ```typescript
   {
     name: 'newllm',
     inputSelector: 'textarea#prompt',
     buttonInsertSelector: '.actions',
     sendButtonSelector: 'button[type="submit"]',
   }
   ```

3. **Test thoroughly**:
   - Input detection
   - Text insertion
   - Button placement
   - Variable substitution

## Performance Optimization

- Content scripts load lazily only on matched pages
- Background service worker is event-driven
- Prompts cached locally to reduce API calls
- Automatic sync throttled by configurable interval

## Security Considerations

- Never log sensitive data (passwords, tokens)
- Use HTTPS for all API calls in production
- Validate all inputs from web pages
- Store tokens securely in Chrome storage (encrypted by browser)
- Follow principle of least privilege for permissions

## Publishing

### Chrome Web Store

1. Create developer account ($5 one-time fee)
2. Prepare store listing:
   - Screenshots (1280x800 or 640x400)
   - Promotional images
   - Detailed description
   - Privacy policy URL
3. Upload ZIP from `pnpm package`
4. Submit for review (usually 1-3 days)

### Microsoft Edge Add-ons

1. Create Partner Center account
2. Similar listing preparation
3. Upload ZIP
4. Submit for review

## Updating the Extension

1. Increment version in `package.json`
2. Update changelog
3. Build and test thoroughly
4. Upload new version to store
5. Users auto-update within 24-48 hours

## Support

- Main docs: See project root README
- Issues: [GitHub Issues](https://github.com/yourusername/prompteasy/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/prompteasy/discussions)

## License

MIT - See LICENSE file
