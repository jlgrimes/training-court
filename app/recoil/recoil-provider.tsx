'use client';

import { RecoilRoot } from 'recoil';

export function RecoilProvider({ children }: { children: React.ReactNode }) {
  return <RecoilRoot>{children}</RecoilRoot>;
}