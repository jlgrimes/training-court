'use client';

import { atom } from 'recoil';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name?: string;
  avatar?: string;
  isPremium?: boolean;
  isAdmin?: boolean;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    emailUpdates?: boolean;
  };
}

export const userAtom = atom<User | null>({
  key: 'userState',
  default: null,
});

export const userProfileAtom = atom<UserProfile | null>({
  key: 'userProfileState',
  default: null,
});

export const sessionAtom = atom<string | null>({
  key: 'sessionState',
  default: null,
});

export const isAuthenticatedAtom = atom<boolean>({
  key: 'isAuthenticatedState',
  default: false,
});

export const authLoadingAtom = atom<boolean>({
  key: 'authLoadingState',
  default: true,
});