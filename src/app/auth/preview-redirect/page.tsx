'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * Production intermediate page for generating preview deployment tokens
 *
 * This page runs on production after successful OAuth.
 * It generates a one-time token and redirects to the preview deployment.
 */
export default function PreviewRedirectPage() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [error, setError] = useState('');

  useEffect(() => {
    const generateTokenAndRedirect = async () => {
      try {
        // Wait for session to be loaded
        if (status === 'loading') return;

        if (status === 'unauthenticated' || !session?.user?.id) {
          setError('Not authenticated');
          return;
        }

        const previewUrl = searchParams.get('previewUrl');
        const callbackPath = searchParams.get('callbackPath') || '/dashboard';

        if (!previewUrl) {
          setError('Missing preview URL');
          return;
        }

        // Generate one-time token
        const response = await fetch('/api/auth/preview-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate token');
        }

        const { token } = await response.json();

        // Build preview callback URL
        const redirectUrl = new URL(previewUrl);
        redirectUrl.pathname = '/auth/preview-callback';
        redirectUrl.searchParams.set('token', token);
        redirectUrl.searchParams.set('callbackUrl', callbackPath);

        // Redirect to preview deployment
        window.location.href = redirectUrl.toString();
      } catch (err) {
        console.error('Preview redirect error:', err);
        setError(err instanceof Error ? err.message : 'Failed to redirect');
      }
    };

    generateTokenAndRedirect();
  }, [session, status, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 max-w-md w-full">
        <div className="text-center">
          <div className="mb-4">
            {error ? (
              <div className="text-red-400 text-lg font-semibold">
                ⚠️ Error
              </div>
            ) : (
              <div className="text-purple-400 text-lg font-semibold">
                🔐 Redirecting to preview...
              </div>
            )}
          </div>

          <div className="text-gray-300 mb-4">
            {error || 'Generating secure token for preview deployment...'}
          </div>

          {!error && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
