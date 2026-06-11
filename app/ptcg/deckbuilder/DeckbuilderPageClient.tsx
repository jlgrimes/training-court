'use client';

import { DeckbuilderClient } from '@/components/ptcg/deckbuilder/DeckbuilderClient';
import { Header } from '@/components/ui/header';
import { useGameGuard } from '@/hooks/useGameGuard';

export function DeckbuilderPageClient({ deckId }: { deckId?: string }) {
  const { user, loading } = useGameGuard('pokemon-tcg');

  if (loading || !user) return null;

  return (
    <>
      <Header description='Build Pokemon TCG decks'>PTCG Deckbuilder</Header>
      <DeckbuilderClient initialDeckId={deckId} userId={user.id} />
    </>
  );
}
