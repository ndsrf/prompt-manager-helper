# Vercel Preview Deployment OAuth Setup

This guide explains how to configure Google OAuth to work on Vercel preview deployments without adding wildcard domains to Google Console.

## The Problem

- Vercel preview deployments have random URLs like `https://your-app-git-branch-abc123.vercel.app`
- Google OAuth doesn't allow wildcard redirect URIs
- By default, OAuth will fail on preview deployments with error: "redirect_uri doesn't comply with Google's OAuth 2.0 policy"

## The Solution

Our implementation uses a client-side redirect approach:
1. Detects when user is on a preview deployment
2. Redirects user to **production** to handle the OAuth flow
3. Production uses its registered redirect_uri (what Google accepts)
4. After authentication, production redirects user back to the preview deployment with auth session

## Required Setup in Vercel

**CRITICAL:** You must configure these environment variables in your Vercel project settings.

### Step-by-Step Instructions

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add or update these environment variables:

   **Variable 1: NEXT_PUBLIC_APP_URL**
   - **Key:** `NEXT_PUBLIC_APP_URL`
   - **Value:** `https://prompteasy.ndsrf.com` (your production URL)
   - **Environments:** Check **ALL three** boxes (Production, Preview, Development)
   - **Note:** Include `https://` and **NO trailing slash**
   - **Purpose:** Preview deployments use this to redirect to production for OAuth

   **Variable 2: NEXTAUTH_URL**
   - **Key:** `NEXTAUTH_URL`
   - **Value:** `https://prompteasy.ndsrf.com` (same as NEXT_PUBLIC_APP_URL)
   - **Environments:** Check **Production** only (or all environments)
   - **Note:** This is the production OAuth callback URL

   **Variable 3: NEXTAUTH_SECRET**
   - **Key:** `NEXTAUTH_SECRET`
   - **Value:** Generate with `openssl rand -base64 32`
   - **Environments:** Check **ALL three** boxes
   - **Note:** This should already be set

4. Click "Save" for each variable
5. Redeploy your application or trigger a new preview deployment

### How It Works

1. **Preview deployments** detect they're on a `*.vercel.app` URL (via `isPreviewDeployment()`)
2. They save the preview URL to localStorage
3. When user clicks "Sign in with Google", they're redirected to production
4. **Production** handles OAuth with Google using its registered redirect_uri
5. After auth succeeds, production redirects back to the preview URL (from callbackUrl)
6. User ends up authenticated on the preview deployment with a valid session

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
   - Detects preview deployment via hostname check
   - Saves preview URL to localStorage
   - Console log: `[Preview Deployment] Detected and saved: https://...`

3. **User clicks "Sign in with Google"**
   - Code detects this is a preview deployment
   - Constructs production OAuth URL with preview callback
   - Redirects browser to: `https://prompteasy.ndsrf.com/api/auth/signin/google?callbackUrl=https://preview-abc123.vercel.app/dashboard`

4. **Production handles OAuth**
   - User is now on production domain
   - NextAuth on production initiates OAuth with Google
   - Google sees: `https://prompteasy.ndsrf.com/api/auth/callback/google`
   - ✅ This is registered in Google Console, so it works!

5. **Google authenticates user**
   - User completes OAuth on Google
   - Google redirects to production: `https://prompteasy.ndsrf.com/api/auth/callback/google?code=...`

6. **Production creates session**
   - NextAuth verifies the OAuth code
   - Creates user in database (if new)
   - Establishes authenticated session

7. **Redirect back to preview**
   - NextAuth redirect callback sees the preview URL in callbackUrl
   - Allows redirect to `*.vercel.app` domain
   - User lands on: `https://my-app-git-feature-abc123.vercel.app/dashboard`
   - ✅ Authenticated on preview deployment with session cookie!

## Troubleshooting

### Error: "redirect_uri doesn't comply with Google's OAuth 2.0 policy" or "redirect_uri_mismatch"

This error should NOT occur with the new implementation, because preview deployments redirect to production for OAuth. If you still see this error:

**Cause 1:** `NEXT_PUBLIC_APP_URL` is not set correctly for preview deployments.

**Fix:**
1. Check Vercel environment variables
2. Ensure `NEXT_PUBLIC_APP_URL` is set for **ALL environments** (Production, Preview, Development)
3. Value should be: `https://prompteasy.ndsrf.com` (your production domain)
4. Include `https://` and no trailing slash
5. Redeploy after making changes

**Cause 2:** The code isn't detecting preview deployment correctly.

**Fix:**
1. Check browser console for `[Preview Deployment] Detected and saved:` message
2. If you don't see it, the detection might be failing
3. Verify you're on a `*.vercel.app` URL
4. Clear browser cache and localStorage, then reload

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
