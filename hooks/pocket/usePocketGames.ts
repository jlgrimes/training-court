'use client'

import useSWR from 'swr'
import { fetchPocketGames } from './usePocketGames.utils';

interface UsePocketGamesOptions {
  limit?: number;
}

export function usePocketGames(userId: string | undefined, options: UsePocketGamesOptions = {}) {
  const { limit } = options;
  const { data, isLoading, error } = useSWR(
    userId ? ['pocket-games', userId, limit ?? 'all'] : null,
    () => fetchPocketGames(userId, { limit })
  );

  return {
    data,
    isLoading,
    error
  }
}
