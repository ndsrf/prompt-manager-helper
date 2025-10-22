# PromptEasy Browser Extension

The official browser extension for PromptEasy - manage and use your AI prompts across ChatGPT, Claude, Gemini, and more.

## Features

- 🚀 **Quick Insert**: Instantly insert your saved prompts into any supported LLM interface
- ✨ **AI Improvements**: Get AI-powered suggestions to improve your prompts
- 💾 **Save Prompts**: Save prompts from chat interfaces directly to your library
- 🔄 **Offline Support**: Cache prompts locally for fast access
- 🎯 **Variable Support**: Fill in template variables before inserting
- ⭐ **Favorites**: Quick access to your most-used prompts
- 🔍 **Search**: Find prompts instantly with full-text search

## Supported Platforms

- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)
- Microsoft Copilot (copilot.microsoft.com)
- Perplexity (perplexity.ai)

## Installation

### Development Build

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the extension:
   ```bash
   pnpm build
   ```

3. Load in Chrome/Edge:
   - Open `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-prod` directory

### Production Build

```bash
pnpm build:chrome  # For Chrome
pnpm build:edge    # For Edge
```

## Development

Run the development server with hot reload:

```bash
pnpm dev
```

This will watch for changes and rebuild automatically.

## Configuration

The extension requires a PromptEasy server to be running. Configure the API URL in the extension options:

1. Click the extension icon
2. Click the settings gear icon
3. Update the "API URL" field
4. Click "Save Settings"

Default: `http://localhost:3000`

## Usage

### Using the Popup

1. Click the PromptEasy icon in your browser toolbar
2. Search for a prompt or browse your library
3. Click a prompt to insert it into the current page

### Using In-Page Buttons

When on a supported LLM page, you'll see three buttons near the input field:

- **📚 Insert Prompt**: Open prompt picker
- **✨ Improve with AI**: Improve the current prompt
- **💾 Save to Library**: Save the current prompt

### Keyboard Shortcuts

You can configure keyboard shortcuts in Chrome:
- Go to `chrome://extensions/shortcuts`
- Find "PromptEasy"
- Set your preferred shortcuts

## Architecture

```
extension/
├── background/        # Service worker for API calls and sync
├── contents/          # Content scripts injected into LLM pages
├── popup/            # Extension popup UI
├── options/          # Settings/options page
├── components/       # Shared React components
├── lib/              # Utilities and type definitions
└── assets/           # Icons and static assets
```

## API Integration

The extension communicates with the PromptEasy web app API using:
- JWT authentication
- tRPC endpoints (planned) or REST API
- Chrome storage for caching

## Security

- All authentication tokens are stored securely in Chrome storage
- API calls are made over HTTPS in production
- No sensitive data is logged

## Building for Production

```bash
# Build for Chrome Web Store
pnpm build:chrome
pnpm package

# Build for Edge Add-ons
pnpm build:edge
pnpm package
```

The packaged extension will be in `build/chrome-mv3-prod.zip` (or `edge-mv3-prod.zip`).

## Publishing

### Chrome Web Store

1. Create a developer account at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Upload the built zip file
3. Fill in store listing details
4. Submit for review

### Edge Add-ons

1. Create a developer account at [Microsoft Partner Center](https://partner.microsoft.com/dashboard)
2. Upload the built zip file
3. Fill in store listing details
4. Submit for review

## Troubleshooting

### Extension not detecting LLM page

- Make sure you're on a supported LLM URL
- Try refreshing the page
- Check if content scripts are enabled for the domain

### Prompts not loading

- Check if you're logged in (click extension icon)
- Verify API URL in settings
- Check browser console for errors
- Try syncing manually in settings

### Insert button not working

- Make sure the input field is visible and focused
- Some LLM interfaces may update their DOM structure
- Report issues on GitHub

## Contributing

See the main project README for contribution guidelines.

## License

MIT License - see LICENSE file for details

## Support

- [Documentation](https://github.com/yourusername/prompteasy)
- [Report Issues](https://github.com/yourusername/prompteasy/issues)
- [Discussion Forum](https://github.com/yourusername/prompteasy/discussions)
