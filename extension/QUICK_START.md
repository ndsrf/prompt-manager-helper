# PromptEasy Extension - Quick Start Guide

Get up and running with the PromptEasy browser extension in 5 minutes!

## Install Dependencies

```bash
cd extension
pnpm install
```

## Start Development

```bash
pnpm dev
```

This starts the Plasmo dev server and creates `build/chrome-mv3-dev/`.

## Load in Browser

### Chrome
1. Open `chrome://extensions/`
2. Toggle "Developer mode" ON (top right)
3. Click "Load unpacked"
4. Navigate to `extension/build/chrome-mv3-dev`
5. Click "Select Folder"

### Edge
1. Open `edge://extensions/`
2. Toggle "Developer mode" ON (left sidebar)
3. Click "Load unpacked"
4. Navigate to `extension/build/chrome-mv3-dev`
5. Click "Select Folder"

## Configure API URL

First time setup:

1. Click the PromptEasy icon in your browser toolbar
2. You'll see a login screen
3. If your API isn't at `localhost:3000`, click the extension icon → Settings gear
4. Update "API URL" to your server URL
5. Click "Save Settings"

## Login

1. Click the extension icon
2. Enter your PromptEasy credentials
3. Click "Sign In"

That's it! The extension will sync your prompts automatically.

## Usage

### Insert a Prompt

**From Popup:**
1. Click extension icon
2. Search or browse prompts
3. Click a prompt to insert

**From LLM Page:**
1. Visit ChatGPT, Claude, etc.
2. Click the 📚 button near the input
3. Select your prompt

### Improve a Prompt

1. Type your prompt in the LLM input
2. Click the ✨ button
3. Wait for AI improvement
4. Improved text automatically replaces original

### Save a Prompt

1. Type your prompt in the LLM input
2. Click the 💾 button
3. Enter a title
4. Prompt saved to your library

## Build for Production

```bash
# Chrome
pnpm build:chrome

# Edge
pnpm build:edge

# Package as ZIP
pnpm package
```

Output in `build/chrome-mv3-prod/` or `build/edge-mv3-prod/`.

## Troubleshooting

### Buttons not appearing on LLM page
- Refresh the page
- Check if the LLM is supported (see README.md)
- Open DevTools console and look for `[PromptEasy]` logs

### API connection failing
- Check API URL in settings
- Ensure backend server is running
- Check for CORS issues in browser console

### Build errors
- Make sure you're in the `extension/` directory
- Delete `.plasmo/` and `node_modules/`, then reinstall
- Check `SETUP.md` for detailed troubleshooting

## Development Tips

- Changes auto-reload (may need to click refresh on extension page)
- Check background worker logs: `chrome://extensions/` → "Inspect views: service worker"
- Check popup logs: Right-click extension icon → "Inspect popup"
- Check content script logs: DevTools console on LLM page

## File Locations

- **Main popup**: `popup/index.tsx`
- **Settings**: `options/index.tsx`
- **Content script**: `contents/prompteasy-injector.tsx`
- **Background**: `background/index.ts`
- **API client**: `lib/api.ts`
- **LLM detection**: `lib/llm-detector.ts`

## Need Help?

- **Full docs**: See `SETUP.md` and `README.md`
- **Issues**: Check GitHub issues
- **Implementation**: See `CHROME_EXTENSION_IMPLEMENTATION.md` in project root

---

Happy prompting! 🚀
