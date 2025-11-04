# Chrome Web Store Listing Information

## Extension Details

**Name:** PromptEasy - AI Prompt Manager

**Version:** 1.1.0

**Category:** Productivity

**Language:** English

## Short Description (132 characters max)
Manage and use your AI prompts across ChatGPT, Claude, Gemini, and more. Save time with instant prompt insertion and AI improvements.

## Detailed Description

PromptEasy is the ultimate browser extension for managing and using your AI prompts across multiple platforms. Stop copying and pasting prompts manually - insert them instantly with one click!

✨ KEY FEATURES

🚀 Quick Insert
- Instantly insert saved prompts into ChatGPT, Claude, Gemini, Copilot, and Perplexity
- One-click access from extension popup or in-page buttons
- Full-text search to find prompts quickly

📚 Prompt Library Management
- Sync prompts across all your devices
- Organize with tags and folders
- Mark favorites for quick access
- Create templates with variables

⚡ AI-Powered Features
- Get AI suggestions to improve your prompts
- Save prompts from chat interfaces directly to your library
- Track usage statistics to understand what works best

🎯 Variable Support
- Create prompt templates with placeholders
- Fill in variables before inserting
- Support for text, number, and dropdown variables

🔄 Offline Support
- Cache prompts locally for fast access
- Work even when offline
- Auto-sync when connection is restored

🛡️ Privacy & Security
- Your data is encrypted and secure
- Open source - review the code yourself
- No tracking, no ads, no data selling

💎 SUPPORTED PLATFORMS

✓ ChatGPT (chat.openai.com & chatgpt.com)
✓ Claude (claude.ai)
✓ Google Gemini (gemini.google.com)
✓ Microsoft Copilot (copilot.microsoft.com)
✓ Perplexity (perplexity.ai)

🎓 PERFECT FOR

- Prompt engineers and AI enthusiasts
- Content creators and marketers
- Developers and technical writers
- Researchers and students
- Anyone who uses AI chat tools regularly

📖 HOW TO USE

1. Install the extension and create an account
2. Generate an API token from your profile
3. Enter the token in the extension to authenticate
4. Start saving and using your prompts!

🔗 REQUIREMENTS

- Active internet connection for syncing
- Free PromptEasy account (sign up at prompteasy.ndsrf.com)
- Chrome or Edge browser

💬 SUPPORT

Need help? We're here for you:
- Documentation: [GitHub URL]
- Report issues: [GitHub Issues URL]
- Community: [Discussion Forum URL]

📜 PRIVACY

We take your privacy seriously:
- All data is encrypted
- No third-party tracking
- You control your data
- Read our full privacy policy

🌟 OPEN SOURCE

PromptEasy is open source! Review the code, contribute, or report issues on GitHub.

Start managing your AI prompts like a pro today! 🚀

---

## Screenshots Required (5-8 recommended)

1. **Extension Popup** - Show the prompt library with search
2. **In-Page Buttons** - Show the buttons injected into ChatGPT/Claude
3. **Variable Dialog** - Show filling in prompt variables
4. **Settings Page** - Show the extension settings
5. **Copy Success** - Show successful prompt insertion
6. **Search Feature** - Show search in action
7. **Favorites** - Show favorited prompts
8. **Usage Tracking** - Show usage statistics (if available in extension)

Recommended size: 1280x800 or 640x400

## Promotional Images

### Small Tile (440x280)
- Extension icon + "PromptEasy" branding
- Tagline: "AI Prompt Manager"

### Large Tile (920x680)
- Hero image showing the extension in action
- Key features listed
- "Get Started" call to action

### Marquee (1400x560)
- Full promotional banner
- Shows multiple platform logos (ChatGPT, Claude, Gemini)
- Key value proposition: "Manage & Insert AI Prompts Instantly"

## Additional Information

**Website:** https://prompteasy.ndsrf.com

**Support Email:** support@prompteasy.com (update with actual email)

**Privacy Policy URL:** https://github.com/yourusername/prompteasy/blob/main/extension/PRIVACY_POLICY.md

**Support/FAQ URL:** https://github.com/yourusername/prompteasy#readme

## Justification for Permissions

### storage
Required to cache prompts locally for offline access and to store user settings and authentication tokens.

### activeTab
Required to insert prompts into the active AI chat interface when the user clicks a prompt.

### tabs
Required to identify which AI platform the user is on to provide appropriate functionality.

### Host Permissions (ChatGPT, Claude, Gemini, etc.)
Required to inject the prompt insertion buttons and detect the input fields on these AI platforms.

### Host Permission (prompteasy.ndsrf.com)
Required to communicate with the PromptEasy API for syncing prompts and user authentication.

## Remote Code

**Does this extension use remote code?** No

All code is bundled with the extension. The extension only communicates with the PromptEasy API for data (prompts, user settings), not code execution.

## Data Usage Disclosure

According to Chrome Web Store requirements:

**What data does your extension collect?**
- User authentication tokens (stored locally)
- Prompt content and metadata
- Usage statistics (which prompts are used and when)
- Technical error logs

**How is the data used?**
- To provide core functionality (syncing prompts)
- To show personal usage analytics
- To improve the extension

**Is data shared with third parties?** No

**Is data sold?** No

**For what purposes is data used?**
- App functionality
- Analytics
- Personalization

## Testing Instructions for Reviewers

1. Install the extension
2. Go to https://prompteasy.ndsrf.com and create a test account
3. Generate an API token from the profile page
4. Open the extension popup and enter the token
5. Create a test prompt in the web app
6. Visit ChatGPT (https://chatgpt.com)
7. Click the extension icon and select the test prompt
8. Verify the prompt is inserted into the ChatGPT input field

**Test Account (Optional):**
If you need a pre-configured test account, contact us at the support email above.

## Release Notes - v1.1.0

### New Features
- Fixed usage tracking for prompt insertions
- Fixed service worker import errors
- Updated manifest to support chatgpt.com domain
- Improved error handling in content scripts

### Bug Fixes
- Resolved React error #130 in content scripts
- Fixed usage not being recorded when inserting prompts
- Fixed theme sync errors in service worker

### Technical Improvements
- Converted content script from .tsx to .ts
- Removed unused React imports
- Updated all host permissions
- Version bump to 1.1.0

---

## Pre-Submission Checklist

- [x] Extension builds without errors
- [x] All icons present (16, 32, 48, 64, 128)
- [x] Manifest version updated to 1.1.0
- [x] Privacy policy created
- [x] Store listing description written
- [ ] Screenshots captured (5-8 images)
- [ ] Promotional images created
- [ ] Support email configured
- [ ] Privacy policy hosted online
- [ ] Test account created for reviewers
- [ ] All placeholder URLs updated with actual URLs
- [ ] Extension tested on all supported platforms

## Notes for Developer

Before submitting to Chrome Web Store:
1. Update all placeholder URLs (GitHub, support email, etc.)
2. Host the privacy policy on a public URL
3. Create all required screenshots
4. Design promotional images
5. Test the extension thoroughly on all supported platforms
6. Package the extension using `pnpm package`
7. Review Chrome Web Store Developer Program Policies
