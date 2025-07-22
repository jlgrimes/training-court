import { TournamentsHomePageRecoil } from '@/components/tournaments/TournamentsHome/TournamentsHomePageRecoil';
import { Metadata } from 'next';
import { TrainingCourtWelcomeClient } from '@/components/TrainingCourtWelcomeClient';

export const metadata: Metadata = {
  title: 'Tournaments',
};

export default function Tournaments() {
  return (
    <>
      <TrainingCourtWelcomeClient />
      <TournamentsHomePageRecoil />
    </>
  );
}