'use client';

import useSWR from 'swr';
import { fetchLiveLogsByRecentDays } from '@/components/battle-logs/utils/battle-log.server.utils';

export function usePaginatedLogsByDay(userId: string | undefined, page: number, pageSize=4) {
    const { data, isLoading, error } = useSWR(
      userId ? ['paginated-logs-by-day', userId, page] : null,
      () => fetchLiveLogsByRecentDays(userId!, page, pageSize)
    );
  
    return {
      data,
      isLoading,
      error
    };
  }
