import { Metadata } from 'next';
import { TournamentsPageClient } from './TournamentsPageClient';

export const metadata: Metadata = {
  title: 'Tournaments',
};

export default function Tournaments() {
  return <TournamentsPageClient />;
}
