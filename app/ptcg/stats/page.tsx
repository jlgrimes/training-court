import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { MatchupsOverview } from '@/components/premium/matchups/MatchupsOverview';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';

export default async function Stats() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  const preferredGames = await fetchPreferredGames(user.id);
  if (!isGameEnabled(preferredGames, 'pokemon-tcg')) {
    return redirect('/preferences');
  }

  return (
    <MatchupsOverview userId={user.id} shouldDisableDrillDown />
  );
}
