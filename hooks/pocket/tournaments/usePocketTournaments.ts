'use client'

import useSWR from 'swr';
import { fetchPocketTournaments } from './usePocketTournaments.utils';

interface UsePocketTournamentsOptions {
  limit?: number;
}

export function usePocketTournaments(userId: string | undefined, options: UsePocketTournamentsOptions = {}) {
  const { limit } = options;
  const { data, isLoading, error } = useSWR(
    userId ? ['pocket-tournaments', userId, limit ?? 'all'] : null,
    () => fetchPocketTournaments(userId, { limit })
  );

  return {
    data,
    isLoading,
    error,
  };
}
