'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { fetchBattleLogs } from './useBattleLogs.utils';
import type { BattleLog } from '@/lib/server/home-data';

/**
 * Get the SWR cache key for battle logs
 */
export function getBattleLogsKey(userId: string | undefined) {
  return userId ? ['battle-logs', userId] : null;
}

interface UseBattleLogsSWROptions {
  /** Server-fetched initial data - no useEffect hydration needed! */
  fallbackData?: BattleLog[];
}

/**
 * SWR hook for battle logs
 *
 * Usage:
 * - Pass fallbackData from server component for instant render
 * - Use mutate() for optimistic updates when adding/deleting logs
 */
export function useBattleLogsSWR(
  userId: string | undefined,
  options: UseBattleLogsSWROptions = {}
) {
  const { data, error, isLoading, mutate } = useSWR(
    getBattleLogsKey(userId),
    () => fetchBattleLogs(userId),
    {
      fallbackData: options.fallbackData,
      revalidateOnFocus: false,
    }
  );

  return {
    logs: data ?? [],
    error,
    isLoading,
    mutate,
  };
}

/**
 * Mutate battle logs cache from anywhere (e.g., AddBattleLogInput)
 * without needing the hook instance
 */
export function mutateBattleLogs(userId: string) {
  return globalMutate(getBattleLogsKey(userId));
}
