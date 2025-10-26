"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc/client';

export type Theme = 'light' | 'dark' | 'futuristic' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark' | 'futuristic';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'futuristic'>('light');
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: session } = useSession();

  // Fetch user settings to get saved theme preference
  const { data: userSettings } = trpc.user.getSettings.useQuery(undefined, {
    enabled: !!session?.user,
  });

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove('light', 'dark', 'futuristic');

    // Determine the actual theme to apply
    let themeToApply: 'light' | 'dark' | 'futuristic';
    if (newTheme === 'system') {
      themeToApply = getSystemTheme();
    } else {
      themeToApply = newTheme;
    }

    // Apply the theme class
    if (themeToApply !== 'light') {
      root.classList.add(themeToApply);
    }

    setResolvedTheme(themeToApply);
  };

  // Set theme and persist to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Initialize theme from user settings, localStorage, or use system default
  useEffect(() => {
    if (isInitialized) return;

    let initialTheme: Theme = 'system';

    // Priority: User settings (if logged in) > localStorage > system default
    if (userSettings && userSettings.theme) {
      initialTheme = userSettings.theme as Theme;
    } else {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      initialTheme = savedTheme || 'system';
    }

    setThemeState(initialTheme);
    applyTheme(initialTheme);
    setIsInitialized(true);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [userSettings, isInitialized]);

  // Re-apply theme when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
