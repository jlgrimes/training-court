import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { DeckbuilderClient } from '@/components/ptcg/deckbuilder/DeckbuilderClient';
import { Header } from '@/components/ui/header';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deckbuilder',
};

type DeckbuilderDeckPageProps = {
  params: {
    deckId: string;
  };
};

export default async function DeckbuilderDeckPage({ params }: DeckbuilderDeckPageProps) {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  const preferredGames = await fetchPreferredGames(user.id);
  if (!isGameEnabled(preferredGames, 'pokemon-tcg')) {
    return redirect('/preferences');
  }

  return (
    <>
      <Header description='Build and plan Pokemon TCG decks'>PTCG Deckbuilder</Header>
      <DeckbuilderClient initialDeckId={params.deckId} />
    </>
  );
}
