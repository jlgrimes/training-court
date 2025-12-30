'use client';

import { atom } from 'recoil';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  type?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

export interface Modal {
  id: string;
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
}

// Dark mode is managed in ../darkMode/darkModeState.ts with localStorage persistence
// Do not add a dark mode atom here to avoid key conflicts

export const sidebarOpenAtom = atom<boolean>({
  key: 'sidebarOpenState',
  default: false,
});

export const mobileMenuOpenAtom = atom<boolean>({
  key: 'mobileMenuOpenState',
  default: false,
});

export const toastsAtom = atom<Toast[]>({
  key: 'toastsState',
  default: [],
});

export const modalsAtom = atom<Modal[]>({
  key: 'modalsState',
  default: [],
});

export const loadingOverlayAtom = atom<boolean>({
  key: 'loadingOverlayState',
  default: false,
});

export const activeTabAtom = atom<string>({
  key: 'activeTabState',
  default: '',
});

export const scrollPositionAtom = atom<{ [key: string]: number }>({
  key: 'scrollPositionState',
  default: {},
});