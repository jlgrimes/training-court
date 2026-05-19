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

export default async function DeckbuilderPage() {
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
      <Header description='Build Pokemon TCG decks'>PTCG Deckbuilder</Header>
      <DeckbuilderClient />
    </>
  );
}
