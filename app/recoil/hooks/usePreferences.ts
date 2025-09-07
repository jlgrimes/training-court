'use client';

import { useRecoilState, useRecoilValue } from 'recoil';
import { useCallback, useEffect, useRef } from 'react';
import { userPreferencesAtom, UserPreferences } from '../atoms/preferences';
import { userAtom } from '../atoms/user';
import { createClient } from '@/utils/supabase/client';

const PREFERENCES_STORAGE_KEY = 'training-court-preferences';

function mergeNested<K extends keyof UserPreferences, NK extends keyof UserPreferences[K]>(
  prev: UserPreferences,
  key: K,
  patch: Partial<UserPreferences[K]>
): UserPreferences {
  return {
    ...prev,
    [key]: { ...(prev[key] as any), ...patch },
  };
}

export function usePreferences() {
  const [preferences, setPreferences] = useRecoilState(userPreferencesAtom);
  const user = useRecoilValue(userAtom);

  const dbWriteTimerRef = useRef<number | null>(null);

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setPreferences(prev => ({ ...prev, [key]: value }));
    },
    [setPreferences]
  );

  const updateNestedPreference = useCallback(
    <K extends keyof UserPreferences, NK extends keyof UserPreferences[K]>(
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
    },
    [setPreferences]
  );

  const resetPreferences = useCallback(() => {
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    setPreferences(prev => ({ ...prev, theme: 'light' }));
  }, [setPreferences]);

  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('selected_games')
          .eq('id', user.id)
          .single();

        if (error) return;

        if (data?.selected_games) {
          setPreferences(prev =>
            mergeNested(prev, 'games', {
              tradingCardGame: data.selected_games.includes('tcg'),
              videoGame: data.selected_games.includes('video'),
              pocket: data.selected_games.includes('pocket'),
            })
          );
        }
      } catch {
        // ignore network/db issues; local still works
      }
    })();
  }, [user?.id, setPreferences]);

  useEffect(() => {
    if (!user?.id) return;

    const write = async () => {
      try {
        const supabase = createClient();
        const g = preferences.games;
        const selected_games = [
          g.tradingCardGame && 'tcg',
          g.videoGame && 'video',
          g.pocket && 'pocket',
        ].filter(Boolean) as string[];

        await supabase.from('profiles').update({ selected_games }).eq('id', user.id);
      } catch {
        // ignore write error; will try again on next change
      }
    };

    if (dbWriteTimerRef.current) {
      window.clearTimeout(dbWriteTimerRef.current);
    }
    dbWriteTimerRef.current = window.setTimeout(write, 400) as unknown as number;

    return () => {
      if (dbWriteTimerRef.current) {
        window.clearTimeout(dbWriteTimerRef.current);
      }
    };
  }, [preferences.games, user?.id]);

  return {
    preferences,
    updatePreference,
    updateNestedPreference,
    resetPreferences,
  };
}
