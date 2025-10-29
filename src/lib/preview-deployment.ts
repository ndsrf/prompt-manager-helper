/**
 * Utility functions for handling Vercel preview deployments with OAuth
 */

const PREVIEW_URL_KEY = 'preview_deployment_url';

/**
 * Checks if the current hostname is a Vercel preview deployment
 */
export function isPreviewDeployment(): boolean {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;
  const productionDomains = [
    'localhost',
    '127.0.0.1',
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, ''),
  ].filter(Boolean);

  // Check if it's a Vercel preview URL (contains vercel.app but not the production domain)
  return hostname.includes('.vercel.app') && !productionDomains.some(domain => hostname === domain);
}

/**
 * Gets the current full URL
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
  } catch (error) {
    console.error('Failed to save preview URL:', error);
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
    console.error('Failed to get preview URL:', error);
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
  } catch (error) {
    console.error('Failed to clear preview URL:', error);
  }
}

/**
 * Gets the appropriate callback URL for OAuth
 * If on a preview deployment, returns the full preview URL + path
 * Otherwise returns just the path
 */
export function getOAuthCallbackUrl(path: string = '/dashboard'): string {
  const previewUrl = getPreviewUrl();
  if (previewUrl) {
    return `${previewUrl}${path}`;
  }
  return path;
}
