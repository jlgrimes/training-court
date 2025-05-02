'use client';

import useSWR from 'swr';
import { fetchPaginatedLogs } from '@/components/battle-logs/utils/battle-log.server.utils';

export function usePaginatedLiveLogs(userId: string | undefined, page: number, pageSize = 20) {
  return useSWR(
    userId ? ['paginated-logs', userId, page, pageSize] : null,
    () => fetchPaginatedLogs(userId!, page, pageSize)
  );
}