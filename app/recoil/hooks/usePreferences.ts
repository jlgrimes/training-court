'use client';

/**
 * usePreferences
 * ---------------
 * Single source of truth for user preferences.
 *
 * Key ideas:
 * 1) The userPreferencesAtom persists itself to localStorage via atomEffect,
 *    so the atom *hydrates synchronously* from disk before React effects run.
 *    => No more "theme reverts to system on refresh".
 *
 * 2) This hook only merges DB-backed fields (currently: `games`).
 *    We never touch `theme` here, so toggling light/dark persists locally
 *    and won’t get clobbered by post-login merges.
 *
 * 3) Writes to DB are debounced to avoid spamming updates.
 */

import { useRecoilState, useRecoilValue } from 'recoil';
import { useCallback, useEffect, useRef } from 'react';
import { userPreferencesAtom, UserPreferences } from '../atoms/preferences';
import { userAtom } from '../atoms/user';
import { createClient } from '@/utils/supabase/client';

const PREFERENCES_STORAGE_KEY = 'training-court-preferences'; // used only by reset()

// Small utility: shallow merge a nested object key while preserving other keys.
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

  // Debounce handle for DB writes to avoid frequent updates.
  const dbWriteTimerRef = useRef<number | null>(null);

  /**
   * updatePreference
   * Overwrite a top-level key of preferences.
   * Example: updatePreference('theme', 'dark')
   */
  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setPreferences(prev => ({ ...prev, [key]: value }));
    },
    [setPreferences]
  );

  /**
   * updateNestedPreference
   * Overwrite a nested key of a specific section.
   * Example: updateNestedPreference('display', 'compactView', true)
   */
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

  /**
   * resetPreferences
   * Reset the atom to its default (as defined in the atom file) and clear localStorage.
   * NOTE: This assumes your atomEffect repopulates from defaults on next mount.
   */
  const resetPreferences = useCallback(() => {
    // If your atom file exports DEFAULT_PREFERENCES, you could import and use it here.
    // Keeping a minimal reset: remove persisted storage and rely on atom default on next load.
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    // Clear current atom state back to an empty object merged against defaults inside the atomEffect.
    // If you prefer a hard reset, you can set explicit defaults here instead.
    setPreferences(prev => ({ ...prev, theme: 'system' })); // minimal nudge; the atomEffect will rehydrate on next mount
  }, [setPreferences]);

  /**
   * Pull DB-backed preferences on login (ONLY the pieces we store server-side).
   * Currently we sync `games` from profiles.selected_games.
   * We DO NOT touch the theme here so local theme persists.
   */
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

        if (error) return; // silently ignore; local stays authoritative

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

  /**
   * Push the `games` subkey to DB when it changes (debounced).
   * We don’t sync other keys here (theme/language/etc. remain local-first).
   */
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

    // Debounce 400ms
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
