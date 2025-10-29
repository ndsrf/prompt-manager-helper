'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Force dynamic rendering - this page uses searchParams and cannot be statically generated
export const dynamic = 'force-dynamic';

/**
 * Preview deployment OAuth callback handler
 *
 * This page handles the redirect from production after OAuth.
 * It exchanges a one-time token for user credentials and creates a session
 * on the preview deployment.
 */
export default function PreviewCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Exchanging authentication token...');

  useEffect(() => {
    const handlePreviewAuth = async () => {
      try {
        const token = searchParams.get('token');
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

        if (!token) {
          setError('Missing authentication token');
          return;
        }

        setStatus('Creating session on preview deployment...');

        // Create session on preview deployment using the token
        const response = await fetch('/api/auth/preview-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: 'Failed to create session' }));
          throw new Error(data.error || 'Failed to create session');
        }

        setStatus('Success! Redirecting...');

        // Redirect to the intended destination
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh(); // Refresh to pick up new session
        }, 500);

      } catch (err) {
        console.error('Preview callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');

        // Redirect to login after a delay
        setTimeout(() => {
          const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
          router.push(`/auth/login?error=preview_auth_failed&callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }, 3000);
      }
    };

    handlePreviewAuth();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 max-w-md w-full">
        <div className="text-center">
          <div className="mb-4">
            {error ? (
              <div className="text-red-400 text-lg font-semibold">
                ⚠️ Authentication Error
              </div>
            ) : (
              <div className="text-purple-400 text-lg font-semibold">
                🔐 Authenticating...
              </div>
            )}
          </div>

          <div className="text-gray-300 mb-4">
            {error || status}
          </div>

          {!error && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          )}

          {error && (
            <div className="text-sm text-gray-400 mt-4">
              Redirecting to login page...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
