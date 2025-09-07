'use client';

import { useEffect } from 'react';
import { useUI } from '@/app/recoil/hooks/useUI';

export const DarkModeProvider = () => {
  const { darkMode } = useUI();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', !!darkMode);
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return null;
};
