'use client'

import useSWR from 'swr'
import { fetchTournamentRounds } from './useTournamentRounds.utils';
import { TournamentTablesConfig, DEFAULT_TOURNAMENT_CONFIG } from '@/lib/tournaments/config';

export function useTournamentRounds(userId: string | undefined, config: TournamentTablesConfig = DEFAULT_TOURNAMENT_CONFIG) {
  const { data, isLoading, error } = useSWR(['tournament-rounds', config.roundsTable, userId], () => fetchTournamentRounds(userId, config));

  return {
    data,
    isLoading,
    error
  }
}
