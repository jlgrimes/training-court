import { TournamentsHomePageRecoil } from '@/components/tournaments/TournamentsHome/TournamentsHomePageRecoil';
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
      <TournamentsHomePageRecoil />
    </>
  );
}