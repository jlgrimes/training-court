'use client';

import { Button } from '../ui/button';
import { Moon, Sun } from 'lucide-react';
import { useUI } from '@/app/recoil/hooks/useUI';

export function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useUI();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      aria-label="Toggle Dark Mode"
    >
      {!darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}