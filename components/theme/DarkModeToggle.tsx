'use client';

import { Button } from '../ui/button';
import { Moon, Sun } from 'lucide-react';
import { usePreferences } from '@/app/recoil/hooks/usePreferences';

export function DarkModeToggle() {
  const { preferences, updatePreference } = usePreferences();
  const isDark = preferences.theme === 'dark';

  const onToggle = () => {
    updatePreference('theme', isDark ? 'light' : 'dark');
  };

  return (
    <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Toggle Dark Mode">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}