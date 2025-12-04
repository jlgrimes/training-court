'use client'

import useSWR from 'swr';
import { fetchPocketTournamentRounds } from './usePocketTournamentRounds.utils';

export function usePocketTournamentRounds(userId: string | undefined) {
  const { data, isLoading, error } = useSWR(['pocket-tournament-rounds', userId], () =>
    fetchPocketTournamentRounds(userId)
  );

  return {
    data,
    isLoading,
    error,
  };
}
