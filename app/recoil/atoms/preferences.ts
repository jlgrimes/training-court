'use client';

import { atom } from 'recoil';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showStats: boolean;
    showBattleLogs: boolean;
  };
  gameplay: {
    defaultFormat: string;
    autoImportLogs: boolean;
    confirmBeforeDelete: boolean;
  };
  display: {
    compactView: boolean;
    showAvatars: boolean;
    animationsEnabled: boolean;
  };
  games: {
    tradingCardGame: boolean;
    videoGame: boolean;
    pocket: boolean;
  };
}

export const userPreferencesAtom = atom<UserPreferences>({
  key: 'userPreferencesState',
  default: {
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    notifications: {
      email: true,
      push: true,
      inApp: true,
    },
    privacy: {
      profileVisibility: 'private',
      showStats: true,
      showBattleLogs: true,
    },
    gameplay: {
      defaultFormat: 'Standard',
      autoImportLogs: false,
      confirmBeforeDelete: true,
    },
    display: {
      compactView: false,
      showAvatars: true,
      animationsEnabled: true,
    },
    games: {
      tradingCardGame: true,
      videoGame: true,
      pocket: true,
    },
  },
});

export const preferencesLoadingAtom = atom<boolean>({
  key: 'preferencesLoadingState',
  default: false,
});