'use client';

import { useEffect } from 'react';
import { useUI } from '@/app/recoil/hooks/useUI';
import { usePreferences } from '@/app/recoil/hooks/usePreferences';

export const DarkModeProvider = () => {
  const { darkMode, setDarkMode } = useUI();
  const { preferences } = usePreferences();

  useEffect(() => {
    // Handle system theme preference
    if (preferences.theme === 'dark') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setDarkMode(e.matches);
      };
      
      setDarkMode(mediaQuery.matches);
      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setDarkMode(preferences.theme === 'light');
    }
  }, [preferences.theme, setDarkMode]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return null;
};
