# Extension Authentication Setup - Quick Start

## Build Status ✅

- **Website Build**: ✅ Successful
- **Extension Build**: ✅ Successful
- **Database Migration**: ✅ Complete

## What Was Fixed

The Chrome extension authentication issue has been resolved by implementing a token-based authentication system instead of relying on session cookies.

## Next Steps

### 1. Extension Tokens UI ✅

The `ExtensionTokens` component has been added to the **Profile page** (`/profile`).

Users can now generate and manage extension tokens directly from their profile.

### 2. Test the Flow

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Login to the website**:
   - Go to `http://localhost:3000`
   - Sign in with your account

3. **Generate an extension token**:
   - Navigate to Profile (`/profile`)
   - Scroll down to "Chrome Extension" section
   - Click "Generate New Token"
   - Give it a name (e.g., "My Chrome Extension")
   - Copy the generated token

4. **Load the extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select: `extension/build/chrome-mv3-prod`

5. **Connect the extension**:
   - Click the extension icon in Chrome toolbar
   - Paste your token in the text area
   - Click "Connect Extension"
   - You should now see your prompts!

### 3. Test API Calls

Once connected, try:
- Searching prompts
- Clicking a prompt to insert it
- Opening the web app from extension
- Logging out and back in

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│   Website       │         │   Extension      │
│   (localhost)   │         │   (chrome-ext://)│
├─────────────────┤         ├──────────────────┤
│ NextAuth        │         │ Bearer Token     │
│ Session Cookies │◄───────►│ Authorization    │
│                 │  Token  │ Header           │
└─────────────────┘         └──────────────────┘
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │   tRPC API  │
              │   Context   │
              └─────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼────┐           ┌─────▼──────┐
    │ Session │           │   Token    │
    │  Auth   │           │   Auth     │
    └─────────┘           └────────────┘
```

## Files Modified

### Backend
- `prisma/schema.prisma` - Added ExtensionToken model
- `src/lib/extension-auth.ts` - Token management functions
- `src/app/api/extension/token/route.ts` - Token API endpoints
- `src/server/api/trpc.ts` - Updated context to accept tokens
- `tsconfig.json` - Excluded extension folder from build

### Frontend
- `src/components/settings/ExtensionTokens.tsx` - Token management UI

### Extension
- `extension/lib/api.ts` - Token-based API client
- `extension/lib/types.ts` - Updated message types
- `extension/background/index.ts` - Token validation handler
- `extension/popup/index.tsx` - Token input UI

## Troubleshooting

### "Invalid token" error
- Check token hasn't expired (90 days)
- Verify token wasn't revoked
- Generate a new token

### Extension can't connect
- Make sure dev server is running
- Check API URL in extension settings (should be `http://localhost:3000`)
- Open browser console for error messages

### Build errors
- Make sure `extension/**/*` is in tsconfig exclude
- Run `npm run build` to verify

## Security Notes

- ✅ Tokens expire after 90 days
- ✅ Tokens can be revoked instantly
- ✅ Each token has a name for easy identification
- ✅ Tokens are only shown once during generation
- ✅ Last used timestamp tracked for audit

## Documentation

See `CHROME_EXTENSION_AUTH.md` for complete technical documentation.
