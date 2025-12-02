import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { AddPocketMatch } from '@/components/pocket/AddPocketMatch';
import { PocketMatchesList } from '@/components/pocket/PocketMatchesList';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/ui/header';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';

export default async function Pocket() {
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
        description='Record your games from PTCG Pocket'
        actionButton={<AddPocketMatch userId={user.id} />}
      >
        Pocket Games
      </Header>
      <PocketMatchesList userId={user.id} />
    </>
  );
}
