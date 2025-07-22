import { TournamentsHomePageRecoil } from '@/components/tournaments/TournamentsHome/TournamentsHomePageRecoil';
import { ActiveDeckIndicator } from '@/components/decks/ActiveDeckIndicator';
import { createClient } from '@/utils/supabase/server';
import { Metadata } from 'next';
import { TrainingCourtWelcomeClient } from '@/components/TrainingCourtWelcomeClient';

export const metadata: Metadata = {
  title: 'Tournaments',
};

export default async function Tournaments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <TrainingCourtWelcomeClient />
      {user && (
        <div className="mb-4">
          <ActiveDeckIndicator userId={user.id} />
        </div>
      )}
      <TournamentsHomePageRecoil />
    </>
  );
}