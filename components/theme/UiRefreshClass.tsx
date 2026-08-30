'use client';

import { useEffect } from 'react';
import { useUiRefresh } from '@/hooks/useUiRefresh';

export function UiRefreshClass() {
  const { enabled } = useUiRefresh();

  useEffect(() => {
    document.documentElement.classList.toggle('ui-refresh', enabled);
    return () => {
      document.documentElement.classList.remove('ui-refresh');
    };
  }, [enabled]);

  return null;
}
