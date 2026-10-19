'use client'

import useSWR from 'swr'
import { fetchTournaments } from './useTournaments.utils'
import { HISTORICAL_SWR_OPTIONS } from '@/lib/swr-options';

export function useTournaments(userId: string | undefined, limit = 26) {
  const { data, isLoading, error } = useSWR(
    userId ? ['tournaments', userId, limit] : null,
    () => fetchTournaments(userId, limit),
    HISTORICAL_SWR_OPTIONS
  );

  return {
    data,
    isLoading,
    error
  }
}
