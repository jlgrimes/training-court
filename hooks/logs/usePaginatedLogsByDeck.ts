'use client';

import useSWR from 'swr';
import { Database } from '@/database.types';

export function usePaginatedLogsByDeck(userId: string | undefined, page: number, daysPerPage: number = 4) {
  const { data, error, isLoading } = useSWR<Database['public']['Tables']['logs']['Row'][] | undefined>(
    userId ? ['logs-by-day', userId, page, daysPerPage] : null,
    () => fetchPaginatedLogsByDistinctDays(userId!, page, daysPerPage)
  );

  return {
    data,
    isLoading,
    error,
  };
}
