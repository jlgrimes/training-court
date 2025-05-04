'use client';

import { useRecoilState } from 'recoil';
import { darkModeState } from '../../app/recoil/darkMode/darkModeState';
import { Switch } from '@/components/ui/switch';

export function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useRecoilState(darkModeState);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">Dark Mode</span>
      <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
    </div>
  );
}