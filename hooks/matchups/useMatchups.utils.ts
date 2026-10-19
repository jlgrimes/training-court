import type { MatchupAggregateRow } from '@/components/premium/matchups/Matchups.types';

export async function fetchMatchups(userId: string | undefined) {
  if (!userId) return null;

  const response = await fetch('/api/stats/user-matchups', {
    method: 'GET',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`Unable to load matchup statistics (${response.status})`);
  }

  const payload = await response.json() as { data?: MatchupAggregateRow[] };
  return payload.data ?? [];
}
