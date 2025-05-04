'use client';

import { atom } from 'recoil';

export const darkModeState = atom<boolean>({
  key: 'darkModeState',
  default: false,
});