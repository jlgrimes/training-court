'use client';

import { selector } from 'recoil';
import { toastsAtom, modalsAtom, darkModeAtom } from '../atoms/ui';
import { userPreferencesAtom } from '../atoms/preferences';

export const activeToastsSelector = selector({
  key: 'activeToastsSelector',
  get: ({ get }) => {
    const toasts = get(toastsAtom);
    return toasts.filter(toast => toast.duration !== 0);
  },
});

export const openModalsSelector = selector({
  key: 'openModalsSelector',
  get: ({ get }) => {
    const modals = get(modalsAtom);
    return modals.filter(modal => modal.isOpen);
  },
});

export const themeSelector = selector({
  key: 'themeSelector',
  get: ({ get }) => {
    const preferences = get(userPreferencesAtom);

    console.log(preferences.theme)
    
    return preferences.theme;
  },
});

export const isAnyModalOpenSelector = selector({
  key: 'isAnyModalOpenSelector',
  get: ({ get }) => {
    const modals = get(modalsAtom);
    return modals.some(modal => modal.isOpen);
  },
});