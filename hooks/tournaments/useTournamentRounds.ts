'use client'

import useSWR from 'swr'
import { fetchTournamentRounds } from './useTournamentRounds.utils';
import { HISTORICAL_SWR_OPTIONS } from '@/lib/swr-options';

export function useTournamentRounds(userId: string | undefined) {
  const { data, isLoading, error } = useSWR(
    userId ? ['tournament-rounds', userId] : null,
    () => fetchTournamentRounds(userId),
    HISTORICAL_SWR_OPTIONS
  );

  return {
    data,
    isLoading,
    error
  }
}
