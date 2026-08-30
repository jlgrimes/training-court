'use client'

import useSWR from 'swr'
import { fetchTournamentRounds } from './useTournamentRounds.utils';

interface UseTournamentRoundsOptions {
  tournamentIds?: string[];
  previewOnly?: boolean;
}

export function useTournamentRounds(userId: string | undefined, options: UseTournamentRoundsOptions = {}) {
  const { tournamentIds, previewOnly } = options;
  const tournamentIdsKey = tournamentIds?.join('|') ?? 'all';
  const shouldFetch = !!userId && (!tournamentIds || tournamentIds.length > 0);
  const { data, isLoading, error } = useSWR(
    shouldFetch ? ['tournament-rounds', userId, tournamentIdsKey, previewOnly ? 'preview' : 'full'] : null,
    () => fetchTournamentRounds(userId, { tournamentIds, previewOnly })
  );

  return {
    data,
    isLoading,
    error
  }
}
