'use client'

import useSWR from 'swr'
import { fetchTournamentRounds } from './useTournamentRounds.utils';
import { HISTORICAL_SWR_OPTIONS } from '@/lib/swr-options';

export function useTournamentRounds(userId: string | undefined, tournamentIds?: string[]) {
  const tournamentKey = tournamentIds ? tournamentIds.join(',') : 'all';
  const { data, isLoading, error } = useSWR(
    userId ? ['tournament-rounds', userId, tournamentKey] : null,
    () => fetchTournamentRounds(userId, tournamentIds),
    HISTORICAL_SWR_OPTIONS
  );

  return {
    data,
    isLoading,
    error
  }
}
