'use client'

import useSWR from 'swr'
import { fetchLiveLogs } from './useLiveLogs.utils';

export function useLiveLogs(userId: string | undefined) {
  const { data, isLoading, error } = useSWR(userId ? ['live-logs', userId] : null, () => fetchLiveLogs(userId));

  return {
    data,
    isLoading,
    error
  }
}
