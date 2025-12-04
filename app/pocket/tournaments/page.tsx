import { redirect } from 'next/navigation';
import { fetchCurrentUser } from '@/components/auth.utils';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';
import { PocketTournamentsHomePage } from '@/components/pocket/tournaments/PocketTournamentsHomePage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pocket Tournaments',
};

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
    <PocketTournamentsHomePage user={user} />
  );
}
