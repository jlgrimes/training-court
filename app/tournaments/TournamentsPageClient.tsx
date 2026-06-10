'use client';

import { TournamentsHomePage } from '@/components/tournaments/TournamentsHome/TournamentsHomePage';
import { TrainingCourtWelcome } from '@/components/TrainingCourtWelcome';
import { useGameGuard } from '@/hooks/useGameGuard';

export function TournamentsPageClient() {
  const { user, loading } = useGameGuard('pokemon-tcg');

  if (loading || !user) return null;

  return (
    <>
      <TrainingCourtWelcome userId={user.id} />
      <TournamentsHomePage user={user} />
    </>
  );
}
