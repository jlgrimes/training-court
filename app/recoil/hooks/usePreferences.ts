'use client';

import { useRecoilState, useRecoilValue } from 'recoil';
import { useCallback, useEffect } from 'react';
import {
  userPreferencesAtom,
  preferencesLoadingAtom,
  UserPreferences,
} from '../atoms/preferences';
import { userAtom } from '../atoms/user';
import { createClient } from '@/utils/supabase/client';

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

  const savePreferences = useCallback(async () => {
    // Save to localStorage
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    
    // Save game preferences to database if user is logged in
    if (user?.id && preferences.games) {
      const supabase = createClient();
      const selectedGames = [];
      if (preferences.games.tradingCardGame) selectedGames.push('tcg');
      if (preferences.games.videoGame) selectedGames.push('video');
      if (preferences.games.pocket) selectedGames.push('pocket');
      
      await supabase
        .from('profiles')
        .update({ selected_games: selectedGames })
        .eq('id', user.id);
    }
  }, [preferences, user]);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      let loadedPreferences = stored ? JSON.parse(stored) : {};
      
      // If user is logged in, load game preferences from database
      if (user?.id) {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('selected_games')
          .eq('id', user.id)
          .single();
        
        if (data?.selected_games) {
          loadedPreferences.games = {
            tradingCardGame: data.selected_games.includes('tcg'),
            videoGame: data.selected_games.includes('video'),
            pocket: data.selected_games.includes('pocket'),
          };
        }
      }
      
      setPreferences(prev => ({ ...prev, ...loadedPreferences }));
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [setPreferences, setLoading, user]);

  // Load preferences on mount and when user changes
  useEffect(() => {
    loadPreferences();
  }, [user?.id]); // Only re-load when user ID changes

  // Save preferences when they change
  useEffect(() => {
    if (!loading) {
      savePreferences();
    }
  }, [preferences, loading]);

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