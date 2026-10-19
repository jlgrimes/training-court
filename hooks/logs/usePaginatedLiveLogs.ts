'use client';

import useSWR from 'swr';
import { fetchPaginatedLogs } from '@/components/battle-logs/utils/battle-log.server.utils';
import { HISTORICAL_SWR_OPTIONS } from '@/lib/swr-options';

export function usePaginatedLiveLogs(
  userId: string | undefined,
  page: number,
  pageSize = 20,
  enabled = true
) {
  return useSWR(
    userId && enabled ? ['paginated-logs', userId, page, pageSize] : null,
    () => fetchPaginatedLogs(userId!, page, pageSize),
    HISTORICAL_SWR_OPTIONS
  );
}
