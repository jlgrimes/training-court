'use client';

import { Button } from '../ui/button';
import { Moon, Sun } from 'lucide-react';
import { usePreferences } from '@/app/recoil/hooks/usePreferences';
import { useRecoilState } from 'recoil';
import { darkModeState } from '@/app/recoil/darkMode/darkModeState';

export function DarkModeToggle() {
  const [darkMode, setDarkMode] = useRecoilState(darkModeState);

  const onToggle = () => {
    setDarkMode(!darkMode)
  };

  return (
    <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Toggle Dark Mode">
      {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}