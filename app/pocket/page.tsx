'use client';

import { AddPocketMatch } from '@/components/pocket/AddPocketMatch';
import { PocketMatchesList } from '@/components/pocket/PocketMatchesList';
import { Header } from '@/components/ui/header';
import { TranslatedText } from '@/components/general-translation/TranslatedText';
import { useGameGuard } from '@/hooks/useGameGuard';

export default function PocketGames() {
  const { user, loading } = useGameGuard('pokemon-pocket');

  if (loading || !user) return null;

  return (
    <>
      <Header
        description={<TranslatedText id="pocket.games.pageDescription">Record your games from PTCG Pocket</TranslatedText>}
        actionButton={<AddPocketMatch userId={user.id} />}
      >
        <TranslatedText id="pocket.games.header">Pocket Games</TranslatedText>
      </Header>
      <PocketMatchesList userId={user.id} />
    </>
  );
}
