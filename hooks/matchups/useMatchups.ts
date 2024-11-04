'use client'

import useSWR from 'swr'
import { fetchMatchups } from './useMatchups.utils';

export function useMatchups(userId: string | undefined) {
  const { data, isLoading, error } = useSWR(['matchups', userId], () => fetchMatchups(userId));

  return {
    data,
    isLoading,
    error
  }
}