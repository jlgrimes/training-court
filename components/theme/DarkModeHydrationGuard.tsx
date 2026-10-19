'use client';

import { useState, useEffect } from 'react';
import { DataLoadingSkeleton } from '@/components/ui/data-loading-skeleton';

export const DarkModeHydrationGuard = ({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="p-4 pt-20"><DataLoadingSkeleton /></div>;

  return <>{children}</>;
};