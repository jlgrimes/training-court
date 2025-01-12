import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { TournamentsHomePage } from '@/components/tournaments/TournamentsHome/TournamentsHomePage';
import { Metadata } from 'next';
import { TrainingCourtWelcome } from '@/components/TrainingCourtWelcome';

export const metadata: Metadata = {
  title: 'Tournaments',
};

export default async function Tournaments() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  return (
    <>
      <TrainingCourtWelcome userId={user.id} />
      <TournamentsHomePage user={user} />
    </>
  );
}
