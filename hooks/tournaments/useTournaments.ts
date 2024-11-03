'use client'

import useSWR from 'swr'
import { fetchTournaments } from './useTournaments.utils'

export function useTournaments(userId: string | undefined) {
  const { data, isLoading, error } = useSWR(['tournaments', userId], () => fetchTournaments(userId));

  return {
    data,
    isLoading,
    error
  }
}