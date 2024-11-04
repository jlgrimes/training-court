'use client'

import useSWR from 'swr'
import { fetchTournamentRounds } from './useTournamentRounds.utils';

export function useTournamentRounds(userId: string | undefined) {
  const { data, isLoading, error } = useSWR(['tournament-rounds', userId], () => fetchTournamentRounds(userId));

  return {
    data,
    isLoading,
    error
  }
}