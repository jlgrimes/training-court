'use client'

import useSWR from 'swr'
import { fetchTournaments } from './useTournaments.utils'

interface UseTournamentsOptions {
  limit?: number;
  page?: number;
  pageSize?: number;
}

export function useTournaments(userId: string | undefined, options: UseTournamentsOptions = {}) {
  const { limit, page, pageSize } = options;
  const { data, isLoading, error } = useSWR(
    userId ? ['tournaments', userId, limit ?? 'all', page ?? null, pageSize ?? null] : null,
    () => fetchTournaments(userId, { limit, page, pageSize })
  );

  return {
    data,
    isLoading,
    error
  }
}
