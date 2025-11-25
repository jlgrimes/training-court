'use client'

import useSWR from 'swr'
import { fetchTournaments } from './useTournaments.utils'
import { TournamentTablesConfig, DEFAULT_TOURNAMENT_CONFIG } from '@/lib/tournaments/config';

export function useTournaments(userId: string | undefined, config: TournamentTablesConfig = DEFAULT_TOURNAMENT_CONFIG) {
  const { data, isLoading, error } = useSWR(['tournaments', config.tournamentsTable, userId], () => fetchTournaments(userId, config));

  return {
    data,
    isLoading,
    error
  }
}
