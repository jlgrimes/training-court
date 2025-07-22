'use client';

import { useRecoilState, useRecoilValue } from 'recoil';
import { useCallback, useEffect } from 'react';
import {
  userPreferencesAtom,
  preferencesLoadingAtom,
  UserPreferences,
} from '../atoms/preferences';
import { userAtom } from '../atoms/user';

const PREFERENCES_STORAGE_KEY = 'training-court-preferences';

export function usePreferences() {
  const [preferences, setPreferences] = useRecoilState(userPreferencesAtom);
  const [loading, setLoading] = useRecoilState(preferencesLoadingAtom);
  const user = useRecoilValue(userAtom);

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, [setPreferences]);

  const updateNestedPreference = useCallback(<
    K extends keyof UserPreferences,
    NK extends keyof UserPreferences[K]
  >(
    key: K,
    nestedKey: NK,
    value: UserPreferences[K][NK]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] as any),
        [nestedKey]: value,
      },
    }));
  }, [setPreferences]);

  const resetPreferences = useCallback(() => {
    const defaultPreferences: UserPreferences = {
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
        profileVisibility: 'public',
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
    };
    setPreferences(defaultPreferences);
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
  }, [setPreferences]);

  const savePreferences = useCallback(() => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const loadPreferences = useCallback(() => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // If user has game preferences in metadata and no games stored locally, use metadata
        if (user?.user_metadata?.games && !parsed.games) {
          parsed.games = user.user_metadata.games;
        }
        
        setPreferences(parsed);
      } else if (user?.user_metadata?.games) {
        // If no stored preferences but user has game metadata, use it
        setPreferences(prev => ({
          ...prev,
          games: user.user_metadata.games,
        }));
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [setPreferences, setLoading, user]);

  // Load preferences on mount and when user changes
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Save preferences when they change
  useEffect(() => {
    if (!loading) {
      savePreferences();
    }
  }, [preferences, loading, savePreferences]);

  return {
    preferences,
    loading,
    updatePreference,
    updateNestedPreference,
    resetPreferences,
    savePreferences,
    loadPreferences,
  };
}