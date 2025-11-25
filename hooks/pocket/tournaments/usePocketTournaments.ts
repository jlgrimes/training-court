'use client'

import useSWR from 'swr';
import { fetchPocketTournaments } from './usePocketTournaments.utils';

export function usePocketTournaments(userId: string | undefined) {
  const { data, isLoading, error } = useSWR(['pocket-tournaments', userId], () =>
    fetchPocketTournaments(userId)
  );

  return {
    data,
    isLoading,
    error,
  };
}
