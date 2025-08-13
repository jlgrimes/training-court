'use client';

import { selector } from 'recoil';
import { notificationsAtom, notificationPreferencesAtom } from '../atoms/notifications';

export const unreadNotificationsSelector = selector({
  key: 'unreadNotificationsSelector',
  get: ({ get }) => {
    const notifications = get(notificationsAtom);
    return notifications.filter(notification => !notification.read);
  },
});

export const filteredNotificationsSelector = selector({
  key: 'filteredNotificationsSelector',
  get: ({ get }) => {
    const notifications = get(notificationsAtom);
    const preferences = get(notificationPreferencesAtom);
    
    return notifications.filter(notification => {
      switch (notification.type) {
        case 'friend_request':
          return preferences.friendRequests;
        case 'tournament_invite':
          return preferences.tournamentInvites;
        case 'battle_log_share':
          return preferences.battleLogShares;
        case 'system':
          return preferences.systemNotifications;
        case 'achievement':
          return preferences.achievements;
        default:
          return true;
      }
    });
  },
});

export const notificationsByTypeSelector = selector({
  key: 'notificationsByTypeSelector',
  get: ({ get }) => {
    const notifications = get(filteredNotificationsSelector);
    
    return notifications.reduce((acc, notification) => {
      if (!acc[notification.type]) {
        acc[notification.type] = [];
      }
      acc[notification.type].push(notification);
      return acc;
    }, {} as Record<string, typeof notifications>);
  },
});