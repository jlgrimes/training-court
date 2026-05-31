'use client';

import { Button } from '../ui/button';
import { Moon, Sun } from 'lucide-react';
import { usePreferences } from '@/app/recoil/hooks/usePreferences';
import { useRecoilState } from 'recoil';
import { darkModeState } from '@/app/recoil/darkMode/darkModeState';
import { useGT } from 'gt-react';

export function DarkModeToggle() {
  const [darkMode, setDarkMode] = useRecoilState(darkModeState);
  const gt = useGT();

  const onToggle = () => {
    setDarkMode(!darkMode)
  };

  return (
    <Button variant="ghost" size="icon" onClick={onToggle} aria-label={gt("Toggle Dark Mode", { $id: "theme.toggleDarkMode" })}>
      {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
