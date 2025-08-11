'use client';

import { useRecoilState, useRecoilValue } from 'recoil';
import { useCallback } from 'react';
import {
  notificationsAtom,
  unreadNotificationsCountAtom,
  notificationsLoadingAtom,
  notificationPreferencesAtom,
  Notification,
} from '../atoms/notifications';
import {
  unreadNotificationsSelector,
  filteredNotificationsSelector,
  notificationsByTypeSelector,
} from '../selectors/notifications';

export function useNotifications() {
  const [notifications, setNotifications] = useRecoilState(notificationsAtom);
  const [unreadCount, setUnreadCount] = useRecoilState(unreadNotificationsCountAtom);
  const [loading, setLoading] = useRecoilState(notificationsLoadingAtom);
  const [preferences, setPreferences] = useRecoilState(notificationPreferencesAtom);
  
  const unreadNotifications = useRecoilValue(unreadNotificationsSelector);
  const filteredNotifications = useRecoilValue(filteredNotificationsSelector);
  const notificationsByType = useRecoilValue(notificationsByTypeSelector);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  }, [setNotifications, setUnreadCount]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [setNotifications, setUnreadCount]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, [setNotifications, setUnreadCount]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, [setNotifications, setUnreadCount]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, [setNotifications, setUnreadCount]);

  const updatePreferences = useCallback((updates: Partial<typeof preferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, [setPreferences]);

  const loadNotifications = useCallback(async (notificationsList: Notification[]) => {
    setLoading(true);
    try {
      setNotifications(notificationsList);
      const unreadCount = notificationsList.filter(n => !n.read).length;
      setUnreadCount(unreadCount);
    } finally {
      setLoading(false);
    }
  }, [setNotifications, setUnreadCount, setLoading]);

  return {
    notifications,
    unreadNotifications,
    filteredNotifications,
    notificationsByType,
    unreadCount,
    loading,
    preferences,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
    updatePreferences,
    loadNotifications,
  };
}