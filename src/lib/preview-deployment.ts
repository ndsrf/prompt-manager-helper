/**
 * Utility functions for handling Vercel preview deployments with OAuth
 *
 * IMPORTANT: For this to work with Google OAuth, you must:
 * 1. Set NEXTAUTH_URL to your production URL in Vercel project settings
 * 2. Set it for ALL environments (Production, Preview, Development)
 * 3. This ensures Google OAuth always uses the production URL as redirect_uri
 */

const PREVIEW_URL_KEY = 'preview_deployment_url';

/**
 * Checks if the current hostname is a Vercel preview deployment
 */
export function isPreviewDeployment(): boolean {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;

  // Get production domain from env var
  const productionUrl = process.env.NEXT_PUBLIC_APP_URL;
  const productionHostname = productionUrl?.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const productionDomains = [
    'localhost',
    '127.0.0.1',
    productionHostname,
  ].filter(Boolean);

  // Check if it's a Vercel preview URL
  // Must contain vercel.app AND not be the production domain
  const isVercelPreview = hostname.includes('.vercel.app') &&
    !productionDomains.some(domain => hostname === domain);

  return isVercelPreview;
}

/**
 * Gets the current full URL origin
 */
export function getCurrentUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

/**
 * Saves the preview deployment URL to localStorage
 */
export function savePreviewUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREVIEW_URL_KEY, url);
    console.log('[Preview Deployment] Saved preview URL:', url);
  } catch (error) {
    console.error('[Preview Deployment] Failed to save preview URL:', error);
  }
}

/**
 * Gets the saved preview URL from localStorage
 */
export function getPreviewUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(PREVIEW_URL_KEY);
  } catch (error) {
    console.error('[Preview Deployment] Failed to get preview URL:', error);
    return null;
  }
}

/**
 * Clears the saved preview URL from localStorage
 */
export function clearPreviewUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PREVIEW_URL_KEY);
    console.log('[Preview Deployment] Cleared preview URL');
  } catch (error) {
    console.error('[Preview Deployment] Failed to clear preview URL:', error);
  }
}
