'use client'

import useSWR from 'swr';
import { fetchPocketTournamentRounds } from './usePocketTournamentRounds.utils';
import { HISTORICAL_SWR_OPTIONS } from '@/lib/swr-options';

export function usePocketTournamentRounds(userId: string | undefined) {
  const { data, isLoading, error } = useSWR(
    userId ? ['pocket-tournament-rounds', userId] : null,
    () => fetchPocketTournamentRounds(userId),
    HISTORICAL_SWR_OPTIONS
  );

  return {
    data,
    isLoading,
    error,
  };
}
