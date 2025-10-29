'use client';

import { useEffect } from 'react';
import { isPreviewDeployment, getCurrentUrl, savePreviewUrl } from '@/lib/preview-deployment';

/**
 * Client component that detects preview deployments and saves the URL to localStorage
 * This enables OAuth redirects to work correctly on Vercel preview deployments
 */
export function PreviewDeploymentDetector() {
  useEffect(() => {
    if (isPreviewDeployment()) {
      const currentUrl = getCurrentUrl();
      savePreviewUrl(currentUrl);
      console.log('[Preview Deployment] Detected and saved:', currentUrl);
    }
  }, []);

  return null; // This component doesn't render anything
}
