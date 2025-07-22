'use client'

import useSWR from 'swr'
import { fetchUserData } from '@/lib/utils/user-data.client';

export function useUserData(userId: string | undefined) {
  const { data, isLoading, error, mutate } = useSWR(['user-data', userId], () => fetchUserData(userId));

  return {
    data,
    isLoading,
    error,
    mutate
  }
}