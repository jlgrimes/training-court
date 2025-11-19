'use client';

import { useEffect } from 'react';
import { useUI } from '@/app/recoil/hooks/useUI';

export const DarkModeProvider = () => {
  const { darkMode } = useUI();

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';

    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.setAttribute('data-theme', theme);

    document.cookie = `theme=${theme}; path=/; max-age=31536000`;
  }, [darkMode]);

  return null;
};
