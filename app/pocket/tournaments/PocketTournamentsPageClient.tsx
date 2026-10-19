'use client';

import { DataLoadingSkeleton } from '@/components/ui/data-loading-skeleton';

import { PocketTournamentsHomePage } from '@/components/pocket/tournaments/PocketTournamentsHomePage';
import { useGameGuard } from '@/hooks/useGameGuard';

export function PocketTournamentsPageClient() {
  const { user, loading } = useGameGuard('pokemon-pocket');

  if (loading) return <DataLoadingSkeleton />;
  if (!user) return null;

  return <PocketTournamentsHomePage userId={user.id} />;
}
