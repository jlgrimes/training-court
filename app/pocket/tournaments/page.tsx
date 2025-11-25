import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { TournamentsHomePage } from '@/components/tournaments/TournamentsHome/TournamentsHomePage';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';
import { TOURNAMENT_CONFIGS } from '@/lib/tournaments/config';

export default async function PocketTournamentsPage() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  const preferredGames = await fetchPreferredGames(user.id);
  if (!isGameEnabled(preferredGames, 'pokemon-pocket')) {
    return redirect('/preferences');
  }

  return <TournamentsHomePage user={user} config={TOURNAMENT_CONFIGS['pokemon-pocket']} />;
}
