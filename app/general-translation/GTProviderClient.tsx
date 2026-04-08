'use client';

import type { ReactNode } from 'react';
import { GTProvider } from 'gt-react';
import gtConfig from '../../gt.config.json';
import loadTranslations from './loadTranslations';

interface GTProviderClientProps {
  children: ReactNode;
}

export default function GTProviderClient({ children }: GTProviderClientProps) {
  return (
    <GTProvider config={gtConfig} loadTranslations={loadTranslations}>
      {children}
    </GTProvider>
  );
}
