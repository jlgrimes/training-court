import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { AddPocketMatch } from '@/components/pocket/AddPocketMatch';
import { PocketMatchesList } from '@/components/pocket/PocketMatchesList';
import { Header } from '@/components/ui/header';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';
import { TranslatedText } from '@/components/general-translation/TranslatedText';

export default async function PocketGames() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  const preferredGames = await fetchPreferredGames(user.id);
  if (!isGameEnabled(preferredGames, 'pokemon-pocket')) {
    return redirect('/preferences');
  }

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
