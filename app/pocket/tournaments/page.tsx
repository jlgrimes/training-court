import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { Header } from '@/components/ui/header';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';
import PocketTournamentCreate from '@/components/pocket/tournaments/PocketTournamentCreate';
import { PocketTournamentList } from '@/components/pocket/tournaments/PocketTournamentList';

export default async function PocketTournaments() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  const preferredGames = await fetchPreferredGames(user.id);
  if (!isGameEnabled(preferredGames, 'pokemon-pocket')) {
    return redirect('/preferences');
  }

  return (
    <div className='flex flex-col gap-4'>
      <Header
        description='Track your Pocket tournaments, rounds, and finishes'
        actionButton={<PocketTournamentCreate userId={user.id} />}
      >
        Pocket Tournaments
      </Header>
      <PocketTournamentList userId={user.id} />
    </div>
  );
}
