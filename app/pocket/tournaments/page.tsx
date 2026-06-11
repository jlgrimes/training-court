import { Metadata } from 'next';
import { PocketTournamentsPageClient } from './PocketTournamentsPageClient';

export const metadata: Metadata = {
  title: 'Pocket Tournaments',
};

export default function PocketTournaments() {
  return <PocketTournamentsPageClient />;
}
