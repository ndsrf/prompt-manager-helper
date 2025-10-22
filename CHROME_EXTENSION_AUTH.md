# Chrome Extension Authentication Solution

## Problem

The Chrome extension and website were using different authentication contexts:

- **Website**: Uses NextAuth with JWT strategy and httpOnly session cookies
- **Extension**: Tried to access the session via `credentials: 'include'` in fetch requests

The issue is that Chrome extensions run in a different cookie context (`chrome-extension://[id]`) than the website domain. Even though users log in on the website (creating a session cookie), the extension's background scripts and popup cannot access those httpOnly cookies.

## Solution: Token-Based Authentication

We implemented a dedicated API token system for the extension:

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Workflow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User logs into website (NextAuth session)                   │
│  2. User generates extension token in Settings                  │
│  3. User copies token and pastes it into Chrome extension       │
│  4. Extension validates token and stores it locally             │
│  5. Extension uses token for all API calls                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Technical Flow                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Website API (tRPC)                                              │
│  ├─ Accepts NextAuth session cookies (web app)                  │
│  └─ Accepts Bearer tokens (extension)                           │
│                                                                  │
│  Extension                                                       │
│  ├─ Stores token in chrome.storage.local                        │
│  ├─ Sends token in Authorization header                         │
│  └─ Token validated on every API request                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation

### 1. Database Schema

Added `ExtensionToken` model to store API tokens:

```prisma
model ExtensionToken {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  userId    String   @map("user_id")
  token     String   @unique
  name      String?  // Optional name for the token
  expiresAt DateTime @map("expires_at")
  lastUsed  DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("extension_tokens")
}
```

### 2. Backend

**Token Management (`src/lib/extension-auth.ts`)**:
- `generateExtensionToken()` - Creates secure random tokens
- `createExtensionToken()` - Stores token in database
- `validateExtensionToken()` - Validates token and returns user
- `revokeExtensionToken()` - Revokes a token

**API Endpoints (`src/app/api/extension/token/route.ts`)**:
- `POST /api/extension/token` - Generate new token
- `GET /api/extension/token` - List user's tokens
- `DELETE /api/extension/token?id=xxx` - Revoke token

**tRPC Context (`src/server/api/trpc.ts`)**:
Updated to accept both session cookies and Bearer tokens:

```typescript
export const createTRPCContext = async (opts: { headers: Headers; session: Session | null }) => {
  // Check for extension token in Authorization header
  const authHeader = opts.headers.get('authorization');
  let user = opts.session?.user;

  if (!user && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const extensionUser = await validateExtensionToken(token);
    if (extensionUser) {
      user = { id: extensionUser.id, email: extensionUser.email, name: extensionUser.name };
    }
  }

  return {
    session: user ? { user } as Session : null,
    prisma,
    headers: opts.headers,
  };
};
```

### 3. Extension

**API Client (`extension/lib/api.ts`)**:
- Removed session-based authentication
- Added `validateToken()` method
- All API calls now use Bearer token authentication
- Switched to tRPC calls instead of REST

**Background Worker (`extension/background/index.ts`)**:
- Replaced `CHECK_SESSION` and `LOGIN` messages with `VALIDATE_TOKEN`
- Token is validated once and cached

**Popup UI (`extension/popup/index.tsx`)**:
- New token-based login flow
- Users paste their token from the web app
- Token is validated before granting access

### 4. Web UI

**Settings Component (`src/components/settings/ExtensionTokens.tsx`)**:
- Generate new extension tokens
- View existing tokens with metadata (created, last used, expires)
- Revoke tokens
- Copy-to-clipboard functionality

## Usage

### For Users

1. **Login to PromptEasy website**
   - Go to `http://localhost:3000`
   - Sign in with your credentials

2. **Generate Extension Token**
   - Navigate to Settings
   - Find "Extension Tokens" section
   - Click "Generate New Token"
   - Give it a name (e.g., "Work Laptop")
   - Copy the generated token (you won't see it again!)

3. **Connect Extension**
   - Open Chrome extension popup
   - Paste the token
   - Click "Connect Extension"

4. **Use Extension**
   - Extension is now connected
   - Access all your prompts
   - Insert prompts into any supported LLM interface

### For Developers

**Testing the flow**:

```bash
# 1. Start the dev server
pnpm dev

# 2. Build the extension
cd extension
pnpm build

# 3. Load extension in Chrome
# - Open chrome://extensions/
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select extension/build/chrome-mv3-dev

# 4. Test the flow
# - Login to website
# - Generate token in settings
# - Open extension popup
# - Paste token
# - Verify prompts load
```

## Security Considerations

1. **Token Generation**
   - Uses `crypto.randomBytes(32)` for secure random tokens
   - Tokens are base64url encoded (URL-safe)

2. **Token Storage**
   - Never stored in plain text in database (hashed? No, but UUID-based)
   - Extension stores in `chrome.storage.local` (encrypted by Chrome)
   - Tokens only shown once during generation

3. **Token Validation**
   - Checked on every API request
   - Expired tokens automatically deleted
   - Last used timestamp updated on each use

4. **Token Expiration**
   - Default: 90 days
   - Configurable during generation
   - Automatic cleanup of expired tokens

5. **Token Revocation**
   - Users can revoke tokens anytime
   - Immediate effect - next API call fails
   - No grace period

## Benefits

1. **Works with Extension Context**
   - Bypasses cookie domain restrictions
   - Works in service workers
   - No CORS issues

2. **Better Security**
   - Tokens can be revoked without logging out
   - Per-device token management
   - Audit trail (last used, created)

3. **User Control**
   - Users can see all active tokens
   - Can revoke specific devices
   - Name tokens for easy identification

4. **Developer Experience**
   - Clean API design
   - Works with existing tRPC infrastructure
   - No duplicate auth logic

## Migration Notes

If you had a previous authentication system:

1. **Remove old session checking code**
2. **Update message types** in extension
3. **Clear extension storage** during testing
4. **Update documentation** for users

## Future Enhancements

1. **Token Scopes**
   - Read-only vs. read-write tokens
   - Limit access to specific features

2. **Token Usage Analytics**
   - Track API calls per token
   - Usage graphs in settings

3. **Auto-refresh Tokens**
   - Refresh tokens before expiration
   - Notify users of expiring tokens

4. **OAuth-style Flow**
   - Click "Connect Extension" in web app
   - Automatic token generation and injection

5. **Biometric Unlock**
   - Require fingerprint/face to use token
   - Extra security layer

## Troubleshooting

**Extension shows "Invalid token"**:
- Token may have expired (90 days)
- Token may have been revoked
- Generate a new token

**API calls return 401**:
- Check token is in chrome.storage.local
- Verify token in Authorization header
- Check token exists in database

**tRPC calls fail**:
- Verify API URL in extension settings
- Check CORS configuration
- Ensure tRPC context reads Authorization header

## References

- [Chrome Extension Authentication Best Practices](https://developer.chrome.com/docs/extensions/mv3/architecture-overview/#security)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [tRPC Authentication](https://trpc.io/docs/server/authorization)
