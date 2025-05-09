'use client';

import { useRecoilState } from 'recoil';
import { darkModeState } from '../../app/recoil/darkMode/darkModeState';
import { Button } from '../ui/button';
import { Moon, Sun } from 'lucide-react';

export function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useRecoilState(darkModeState);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDarkMode(!isDarkMode)}
      aria-label="Toggle Dark Mode"
    >
      {!isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}