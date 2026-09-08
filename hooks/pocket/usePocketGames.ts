'use client'

import useSWR from 'swr'
import { fetchPocketGames } from './usePocketGames.utils';
import { HISTORICAL_SWR_OPTIONS } from '@/lib/swr-options';

export function usePocketGames(userId: string | undefined) {
  const { data, isLoading, error } = useSWR(
    userId ? ['pocket-games', userId] : null,
    () => fetchPocketGames(userId),
    HISTORICAL_SWR_OPTIONS
  );

  return {
    data,
    isLoading,
    error
  }
}
