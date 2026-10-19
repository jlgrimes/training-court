'use client'

import useSWR from 'swr';
import { fetchPocketTournamentRounds } from './usePocketTournamentRounds.utils';
import { HISTORICAL_SWR_OPTIONS } from '@/lib/swr-options';

export function usePocketTournamentRounds(userId: string | undefined, tournamentIds?: string[]) {
  const tournamentKey = tournamentIds ? tournamentIds.join(',') : 'all';
  const { data, isLoading, error } = useSWR(
    userId ? ['pocket-tournament-rounds', userId, tournamentKey] : null,
    () => fetchPocketTournamentRounds(userId, tournamentIds),
    HISTORICAL_SWR_OPTIONS
  );

  return {
    data,
    isLoading,
    error,
  };
}
