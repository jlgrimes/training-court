'use client'

import useSWR from 'swr'
import { fetchPocketGames } from './usePocketGames.utils';

export function usePocketGames(userId: string | undefined) {
  const { data, isLoading, error } = useSWR(['pocket-games', userId], () => fetchPocketGames(userId));

  return {
    data,
    isLoading,
    error
  }
}