'use client';

import { selector } from 'recoil';
import { userAtom, userProfileAtom, isAuthenticatedAtom } from '../atoms/user';

export const currentUserSelector = selector({
  key: 'currentUserSelector',
  get: ({ get }) => {
    const user = get(userAtom);
    const profile = get(userProfileAtom);
    const isAuthenticated = get(isAuthenticatedAtom);
    
    if (!isAuthenticated || !user) {
      return null;
    }
    
    return {
      ...user,
      profile,
    };
  },
});

export const isPremiumUserSelector = selector({
  key: 'isPremiumUserSelector',
  get: ({ get }) => {
    const profile = get(userProfileAtom);
    return profile?.isPremium || false;
  },
});

export const isAdminUserSelector = selector({
  key: 'isAdminUserSelector',
  get: ({ get }) => {
    const profile = get(userProfileAtom);
    return profile?.isAdmin || false;
  },
});

export const userDisplayNameSelector = selector({
  key: 'userDisplayNameSelector',
  get: ({ get }) => {
    const user = get(userAtom);
    const profile = get(userProfileAtom);
    
    return profile?.name || user?.email?.split('@')[0] || 'Anonymous';
  },
});