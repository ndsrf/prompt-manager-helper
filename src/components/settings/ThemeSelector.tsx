"use client";

import React from 'react';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';

const themeOptions = [
  { value: 'system', label: 'System', description: 'Use system preference' },
  { value: 'light', label: 'Light', description: 'Light theme' },
  { value: 'dark', label: 'Dark', description: 'Dark theme' },
  { value: 'futuristic', label: 'Futuristic', description: 'Neon cyberpunk theme' },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const updateThemeMutation = trpc.user.updateSettings.useMutation({
    onSuccess: () => {
      // Invalidate and refetch user settings
      utils.user.getSettings.invalidate();
    },
  });

  const handleThemeChange = async (newTheme: Theme) => {
    // Update local theme immediately for instant feedback
    setTheme(newTheme);

    // Save to database if user is logged in
    if (session?.user) {
      try {
        await updateThemeMutation.mutateAsync({
          settings: { theme: newTheme },
        });
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>
          Choose your preferred color theme. The theme will be applied across the application and extension.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="theme-select">Select Theme</Label>
          <Select value={theme} onValueChange={handleThemeChange}>
            <SelectTrigger id="theme-select" className="w-full">
              <SelectValue placeholder="Select a theme" />
            </SelectTrigger>
            <SelectContent>
              {themeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Theme Preview */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {themeOptions.filter(t => t.value !== 'system').map((option) => (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value as Theme)}
                className={`p-3 rounded-md border-2 transition-all ${
                  theme === option.value
                    ? 'border-primary'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div className="text-xs font-medium mb-2">{option.label}</div>
                <div className={`h-8 rounded ${
                  option.value === 'light'
                    ? 'bg-gradient-to-br from-white to-gray-100'
                    : option.value === 'dark'
                    ? 'bg-gradient-to-br from-gray-900 to-gray-800'
                    : 'bg-gradient-to-br from-cyan-500 to-purple-600'
                }`} />
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
