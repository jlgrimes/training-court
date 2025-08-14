'use client';

import { atom } from 'recoil';

export interface Notification {
  id: string;
  type: 'friend_request' | 'tournament_invite' | 'battle_log_share' | 'system' | 'achievement';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export const notificationsAtom = atom<Notification[]>({
  key: 'notificationsState',
  default: [],
});

export const unreadNotificationsCountAtom = atom<number>({
  key: 'unreadNotificationsCountState',
  default: 0,
});

export const notificationsLoadingAtom = atom<boolean>({
  key: 'notificationsLoadingState',
  default: false,
});

export const notificationPreferencesAtom = atom<{
  friendRequests: boolean;
  tournamentInvites: boolean;
  battleLogShares: boolean;
  systemNotifications: boolean;
  achievements: boolean;
}>({
  key: 'notificationPreferencesState',
  default: {
    friendRequests: true,
    tournamentInvites: true,
    battleLogShares: true,
    systemNotifications: true,
    achievements: true,
  },
});