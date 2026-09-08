'use client'

import useSWR from 'swr'
import { fetchMatchups } from './useMatchups.utils';
import { HISTORICAL_SWR_OPTIONS } from '@/lib/swr-options';

export function useMatchups(userId: string | undefined) {
  const { data, isLoading, error } = useSWR(
    userId ? ['matchups', userId] : null,
    () => fetchMatchups(userId),
    HISTORICAL_SWR_OPTIONS
  );

  return {
    data,
    isLoading,
    error
  }
}
