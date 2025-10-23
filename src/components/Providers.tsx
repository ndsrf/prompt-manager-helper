'use client';

import { SessionProvider } from 'next-auth/react';
import { TRPCProvider } from '@/lib/trpc/Provider';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </TRPCProvider>
    </SessionProvider>
  );
}
