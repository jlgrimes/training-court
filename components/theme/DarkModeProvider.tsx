'use client';

import { useRecoilValue } from 'recoil';
import { darkModeState } from '@/app/recoil/darkMode/darkModeState';
import { useEffect } from 'react';

export const DarkModeProvider = () => {
  const isDarkMode = useRecoilValue(darkModeState);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return null;
};
