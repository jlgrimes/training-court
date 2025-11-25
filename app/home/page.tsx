import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { BattleLogsHomePreview } from '@/components/battle-logs/BattleLogsHome/BattleLogsHomePreview';
import { TournamentsHomePreview } from '@/components/tournaments/TournamentsHome/TournamentsHomePreview';
import { TrainingCourtWelcome } from '@/components/TrainingCourtWelcome';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';

export default async function Profile() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  const preferredGames = await fetchPreferredGames(user.id);
  const showPokemonTcg = isGameEnabled(preferredGames, 'pokemon-tcg');

  return (
    <>
      <TrainingCourtWelcome userId={user.id} />

      {showPokemonTcg && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
          <BattleLogsHomePreview userId={user.id} />
          <TournamentsHomePreview user={user} />
        </div>
      )}
    </>
  );
}
