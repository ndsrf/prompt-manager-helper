'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from './client';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1, // Only retry once on failure
        staleTime: 5000, // Consider data stale after 5 seconds
      },
    },
  }));

  const [trpcClient] = useState(() => {
    // Use dynamic URL based on current window location in browser
    const getBaseUrl = () => {
      if (typeof window !== 'undefined') {
        // Browser should use relative URL
        return window.location.origin;
      }
      if (process.env.NEXT_PUBLIC_APP_URL) {
        // SSR should use env var
        return process.env.NEXT_PUBLIC_APP_URL;
      }
      // Fallback for dev
      return 'http://localhost:3000';
    };

    const url = `${getBaseUrl()}/api/trpc`;
    console.log('[TRPCProvider] Initializing tRPC client with URL:', url);

    return trpc.createClient({
      links: [
        httpBatchLink({
          url,
        }),
      ],
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
