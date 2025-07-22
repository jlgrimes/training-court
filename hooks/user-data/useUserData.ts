'use client'

import useSWR from 'swr'
import { fetchUserData } from './useUserData.utils';

export function useUserData(userId: string | undefined) {
  const { data, isLoading, error, mutate } = useSWR(['user-data', userId], () => fetchUserData(userId));

  return {
    data,
    isLoading,
    error,
    mutate
  }
}