'use client'

import useSWR from 'swr';
import { fetchPocketTournamentRounds } from './usePocketTournamentRounds.utils';

interface UsePocketTournamentRoundsOptions {
  tournamentIds?: string[];
}

export function usePocketTournamentRounds(userId: string | undefined, options: UsePocketTournamentRoundsOptions = {}) {
  const { tournamentIds } = options;
  const tournamentIdsKey = tournamentIds?.join('|') ?? 'all';
  const shouldFetch = !!userId && (!tournamentIds || tournamentIds.length > 0);
  const { data, isLoading, error } = useSWR(
    shouldFetch ? ['pocket-tournament-rounds', userId, tournamentIdsKey] : null,
    () => fetchPocketTournamentRounds(userId, { tournamentIds })
  );

  return {
    data,
    isLoading,
    error,
  };
}
