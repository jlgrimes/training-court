'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Moon, Sun } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'system';
const LS_KEY = 'training-court-preferences';

function readThemeFromLS(): ThemeMode {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    const t = obj?.theme;
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

function writeThemeToLS(mode: ThemeMode) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    obj.theme = mode;
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {

  }
}

function systemPrefersDark() {
  return typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function DarkModeToggle() {
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    setMode(readThemeFromLS());
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemPrefersDark());
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const onToggle = () => {
    const next: ThemeMode = isDark ? 'light' : 'dark';
    writeThemeToLS(next);
    setMode(next);
  };

  return (
    <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Toggle Dark Mode">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
