'use client';

import { RecoilObserver } from '@theohagos/recoil-observer';
import { RecoilRoot } from 'recoil';

export function RecoilProvider({ children }: { children: React.ReactNode }) {
  return <RecoilRoot>
    {/* <RecoilObserver env="development" /> */}
    {children}</RecoilRoot>;
}