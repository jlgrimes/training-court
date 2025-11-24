import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { TournamentsHomePage } from '@/components/tournaments/TournamentsHome/TournamentsHomePage';
import { Metadata } from 'next';
import { TrainingCourtWelcome } from '@/components/TrainingCourtWelcome';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';

export const metadata: Metadata = {
  title: 'Tournaments',
};

export default async function Tournaments() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  const preferredGames = await fetchPreferredGames(user.id);
  if (!isGameEnabled(preferredGames, 'ptcg-live')) {
    return redirect('/preferences');
  }

  return (
    <>
      <TrainingCourtWelcome userId={user.id} />
      <TournamentsHomePage user={user} />
    </>
  );
}
