'use client'

import useSWR from 'swr';
import { fetchPocketTournaments } from './usePocketTournaments.utils';
import { HISTORICAL_SWR_OPTIONS } from '@/lib/swr-options';

export function usePocketTournaments(userId: string | undefined) {
  const { data, isLoading, error } = useSWR(
    userId ? ['pocket-tournaments', userId] : null,
    () => fetchPocketTournaments(userId),
    HISTORICAL_SWR_OPTIONS
  );

  return {
    data,
    isLoading,
    error,
  };
}
