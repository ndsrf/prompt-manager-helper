# Vercel Preview Deployment OAuth Setup

This guide explains how to configure Google OAuth to work on Vercel preview deployments without adding wildcard domains to Google Console.

## The Problem

- Vercel preview deployments have random URLs like `https://your-app-git-branch-abc123.vercel.app`
- Google OAuth doesn't allow wildcard redirect URIs
- By default, OAuth will fail on preview deployments with error: "redirect_uri doesn't comply with Google's OAuth 2.0 policy"

## The Solution

Our implementation uses a client-side workaround:
1. Detects preview deployments and saves the URL to localStorage
2. Uses production URL for OAuth redirect_uri (what Google sees)
3. After authentication, redirects user back to the preview deployment

## Required Setup in Vercel

**CRITICAL:** You must configure two environment variables in your Vercel project settings.

### Step-by-Step Instructions

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add or update these environment variables:

   **Variable 1: NEXTAUTH_URL**
   - **Key:** `NEXTAUTH_URL`
   - **Value:** `https://prompteasy.ndsrf.com` (your production URL)
   - **Environments:** Check **ALL three** boxes (Production, Preview, Development)
   - **Note:** Include `https://` and **NO trailing slash**

   **Variable 2: NEXTAUTH_URL_INTERNAL**
   - **Key:** `NEXTAUTH_URL_INTERNAL`
   - **Value:** `https://prompteasy.ndsrf.com` (same as NEXTAUTH_URL)
   - **Environments:** Check **ALL three** boxes (Production, Preview, Development)
   - **Note:** This forces server-side NextAuth calls to use production URL

4. Click "Save" for each variable
5. Redeploy your application or trigger a new preview deployment

### Why Both Variables Are Needed

- `NEXTAUTH_URL`: Client-side OAuth redirect URI
- `NEXTAUTH_URL_INTERNAL`: Server-side API calls (prevents Vercel from using internal URLs)

Without both set to production for preview deployments, NextAuth will use Vercel's preview URL as the redirect_uri, causing Google to reject the OAuth request.

### Why This Works

When `NEXTAUTH_URL` is set to production for all environments:
- OAuth always uses your production URL as the `redirect_uri` with Google
- Google accepts it because it's registered in Google Console
- After auth completes, NextAuth's redirect callback sends users back to the preview URL
- Users stay authenticated on the preview deployment

## Google Console Configuration

Keep your Google OAuth configuration simple - **only add your production domain:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add **Authorized redirect URIs**:
   ```
   https://your-production-domain.com/api/auth/callback/google
   ```
4. **Do NOT add Vercel preview URLs** - they're not needed!

## How It Works

### The Authentication Flow

1. **User visits preview deployment**
   ```
   https://my-app-git-feature-abc123.vercel.app
   ```

2. **Preview URL is detected and saved**
   - `PreviewDeploymentDetector` component runs on page load
   - Saves preview URL to localStorage
   - Console log: `[Preview Deployment] Detected and saved: https://...`

3. **User clicks "Sign in with Google"**
   - `getOAuthCallbackUrl()` returns full preview URL
   - NextAuth initiates OAuth with Google

4. **OAuth redirect to Google**
   - Uses `NEXTAUTH_URL` (production) as `redirect_uri`
   - Google sees: `https://your-production-domain.com/api/auth/callback/google`
   - ✅ This is registered in Google Console, so it works!

5. **Google redirects to production callback**
   - User authenticates with Google
   - Google redirects to production: `https://your-production-domain.com/api/auth/callback/google?code=...`

6. **NextAuth processes authentication**
   - Verifies the OAuth code
   - Creates user session
   - Calls `redirect` callback with the saved preview URL

7. **User is redirected to preview deployment**
   - NextAuth redirect callback allows `*.vercel.app` domains
   - User lands on: `https://my-app-git-feature-abc123.vercel.app/dashboard`
   - ✅ Authenticated on preview deployment!

## Troubleshooting

### Error: "redirect_uri doesn't comply with Google's OAuth 2.0 policy" or "redirect_uri_mismatch"

This means Google is receiving a redirect_uri that isn't registered in Google Console.

**Cause 1:** `NEXTAUTH_URL` is not set to production for preview deployments.

**Fix:**
1. Check Vercel environment variables
2. Ensure `NEXTAUTH_URL` is set for **Preview** environment (not just Production)
3. Verify the value includes `https://` (e.g., `https://prompteasy.ndsrf.com`)
4. Redeploy to apply changes

**Cause 2:** `NEXTAUTH_URL_INTERNAL` is not set.

**Fix:**
1. Check Vercel environment variables
2. Ensure **both** `NEXTAUTH_URL` and `NEXTAUTH_URL_INTERNAL` are set
3. Both should have the same value: your production URL
4. Both should be set for **all environments** (Production, Preview, Development)
5. Redeploy after adding the variables

**Cause 3:** The production URL isn't registered in Google Console.

**Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Ensure your production callback is listed: `https://prompteasy.ndsrf.com/api/auth/callback/google`
4. Save changes (may take a few minutes to propagate)

### Error: "Invalid callback URL"

**Cause:** Preview URL might not be properly saved to localStorage.

**Fix:**
1. Check browser console for `[Preview Deployment]` logs
2. Clear localStorage and reload the page
3. Verify `NEXT_PUBLIC_APP_URL` is set correctly in environment variables

### OAuth works on production but not preview

**Cause:** `NEXTAUTH_URL` is only set for production environment.

**Fix:**
1. In Vercel settings, edit the `NEXTAUTH_URL` variable
2. Check all three checkboxes: Production, Preview, Development
3. Save and redeploy

## Code Implementation

The implementation consists of:

1. **Preview detection** (`src/lib/preview-deployment.ts`)
   - Detects Vercel preview URLs
   - Manages localStorage for preview URL storage

2. **Auto-detection component** (`src/components/PreviewDeploymentDetector.tsx`)
   - Runs on every page load
   - Saves preview URL automatically

3. **OAuth callback logic** (`src/lib/auth.ts`)
   - NextAuth redirect callback
   - Allows redirects to `*.vercel.app` domains

4. **Login/Register pages** (`src/app/auth/*/page.tsx`)
   - Use preview-aware callback URLs
   - Work seamlessly on both production and preview

## Testing

1. Create a new branch and push to trigger a preview deployment
2. Visit the preview deployment URL
3. Check browser console for: `[Preview Deployment] Detected and saved: ...`
4. Click "Sign in with Google"
5. Complete OAuth flow
6. You should be redirected back to the preview deployment, authenticated!

## Security Considerations

- ✅ Only `*.vercel.app` domains are allowed for redirects
- ✅ Production domain is still the primary OAuth endpoint
- ✅ No changes needed to Google Console configuration
- ✅ Preview URLs are client-side only (stored in localStorage)
- ✅ No security compromise - Google still validates against production URL

## Additional Notes

- This approach works for any OAuth provider that doesn't support wildcards
- You can extend this for other environments (staging, etc.)
- The preview URL is saved per-browser, so multiple users can test different previews
- Clearing localStorage will reset the preview URL (just reload the page)
