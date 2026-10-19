'use client'

import useSWR from 'swr'
import { fetchPocketGames } from './usePocketGames.utils';
import { HISTORICAL_SWR_OPTIONS } from '@/lib/swr-options';

export function usePocketGames(userId: string | undefined, limit?: number) {
  const { data, isLoading, error } = useSWR(
    userId ? ['pocket-games', userId, limit ?? 'all'] : null,
    () => fetchPocketGames(userId, limit),
    HISTORICAL_SWR_OPTIONS
  );

  return {
    data,
    isLoading,
    error
  }
}
