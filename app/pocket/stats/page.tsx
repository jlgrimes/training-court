import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';
import { PocketStatsSummary } from '@/components/pocket/stats/PocketStatsSummary';

export default async function PocketStats() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  const preferredGames = await fetchPreferredGames(user.id);
  if (!isGameEnabled(preferredGames, 'pokemon-pocket')) {
    return redirect('/preferences');
  }

  return <PocketStatsSummary userId={user.id} />;
}
