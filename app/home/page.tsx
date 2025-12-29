import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { BattleLogsHomePreview } from '@/components/battle-logs/BattleLogsHome/BattleLogsHomePreview';
import { TournamentsHomePreview } from '@/components/tournaments/TournamentsHome/TournamentsHomePreview';
import { TrainingCourtWelcome } from '@/components/TrainingCourtWelcome';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { GamePreferences } from '@/components/preferences/GamePreferences';
import { isGameEnabled } from '@/lib/game-preferences';
import { PocketHomePreview } from '@/components/pocket/PocketHomePreview';
import { PocketTournamentsHomePreview } from '@/components/pocket/tournaments/PocketTournamentsHomePreview';
import { Separator } from '@/components/ui/separator';

export default async function Home() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  const preferredGames = await fetchPreferredGames(user.id);
  const hasPreferredGames = preferredGames.length > 0;
  const showPokemonTcg = isGameEnabled(preferredGames, 'pokemon-tcg');
  const showPokemonPocket = isGameEnabled(preferredGames, 'pokemon-pocket');

  return (
    <>
      <TrainingCourtWelcome userId={user.id} />

      {!hasPreferredGames && (
        <div>
          <GamePreferences
            userId={user.id}
            initialPreferredGames={preferredGames}
          />
        </div>
      )}

      {hasPreferredGames && showPokemonTcg && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
          <BattleLogsHomePreview userId={user.id} />
          <TournamentsHomePreview user={user} />
        </div>
      )}
      {hasPreferredGames && showPokemonPocket && (
        <>
          <Separator />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
            <PocketHomePreview userId={user.id} />
            <PocketTournamentsHomePreview user={user} />
          </div>
        </>
      )}
    </>
  );
}
