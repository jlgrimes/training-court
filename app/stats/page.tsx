'use client';

import { MatchupsOverview } from '@/components/premium/matchups/MatchupsOverview';
import { useGameGuard } from '@/hooks/useGameGuard';

export default function Stats() {
  const { user, loading } = useGameGuard('pokemon-tcg');

  if (loading || !user) return null;

  return (
    <MatchupsOverview userId={user.id} shouldDisableDrillDown />
  );
}
