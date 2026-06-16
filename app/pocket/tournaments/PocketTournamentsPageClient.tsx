'use client';

import { PocketTournamentsHomePage } from '@/components/pocket/tournaments/PocketTournamentsHomePage';
import { useGameGuard } from '@/hooks/useGameGuard';

export function PocketTournamentsPageClient() {
  const { user, loading } = useGameGuard('pokemon-pocket');

  if (loading || !user) return null;

  return <PocketTournamentsHomePage userId={user.id} />;
}
