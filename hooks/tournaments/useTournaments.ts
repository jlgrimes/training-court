'use client'

import useSWR from 'swr'
import { fetchTournaments } from './useTournaments.utils'
import { HISTORICAL_SWR_OPTIONS } from '@/lib/swr-options';

export function useTournaments(userId: string | undefined) {
  const { data, isLoading, error } = useSWR(
    userId ? ['tournaments', userId] : null,
    () => fetchTournaments(userId),
    HISTORICAL_SWR_OPTIONS
  );

  return {
    data,
    isLoading,
    error
  }
}
