'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecoilValue } from 'recoil';
import { userDataAtom, userDataLoadingAtom } from '@/app/recoil/atoms/user';
import {
  GameId,
  isGameEnabled,
  normalizePreferredGames,
} from '@/lib/game-preferences';
import { useAuthGuard } from './useAuthGuard';

export function usePreferredGames() {
  const userData = useRecoilValue(userDataAtom);
  const loading = useRecoilValue(userDataLoadingAtom);
  return {
    preferredGames: normalizePreferredGames(userData?.preferred_games),
    loading,
  };
}

/**
 * Auth guard + game-preference gate: redirects unauthenticated visitors,
 * and sends users who haven't enabled `gameId` to /preferences.
 * Mirrors the old server-side fetchPreferredGames + redirect pattern.
 */
export function useGameGuard(gameId: GameId) {
  const { user, loading: authLoading } = useAuthGuard();
  const { preferredGames, loading: prefsLoading } = usePreferredGames();
  const router = useRouter();

  const loading = authLoading || (!!user && prefsLoading);
  const enabled = isGameEnabled(preferredGames, gameId);

  useEffect(() => {
    if (!loading && user && !enabled) {
      router.push('/preferences');
    }
  }, [loading, user, enabled, router]);

  return { user, loading, enabled };
}
