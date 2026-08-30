'use client';

import useSWR from 'swr';
import { fetchPaginatedLogsByDistinctDays } from './useLiveLogs.utils';
import { BattleLogPreviewRecord } from '@/components/battle-logs/utils/battle-log-preview.utils';

export function usePaginatedLogsByDeck(userId: string | undefined, page: number, daysPerPage: number = 4) {
  const { data, error, isLoading } = useSWR<BattleLogPreviewRecord[] | undefined>(
    userId ? ['logs-by-day', userId, page, daysPerPage] : null,
    () => fetchPaginatedLogsByDistinctDays(userId!, page, daysPerPage)
  );

  return {
    data,
    isLoading,
    error,
  };
}
