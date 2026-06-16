'use client';

import { BattleLogsHomePreview } from '@/components/battle-logs/BattleLogsHome/BattleLogsHomePreview';
import { TournamentsHomePreview } from '@/components/tournaments/TournamentsHome/TournamentsHomePreview';
import { TrainingCourtWelcome } from '@/components/TrainingCourtWelcome';
import { GamePreferences } from '@/components/preferences/GamePreferences';
import { isGameEnabled } from '@/lib/game-preferences';
import { PocketHomePreview } from '@/components/pocket/PocketHomePreview';
import { PocketTournamentsHomePreview } from '@/components/pocket/tournaments/PocketTournamentsHomePreview';
import { Separator } from '@/components/ui/separator';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { usePreferredGames } from '@/hooks/useGameGuard';

export default function Home() {
  const { user, loading } = useAuthGuard();
  const { preferredGames, loading: prefsLoading } = usePreferredGames();

  if (loading || !user || prefsLoading) return null;

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
          <TournamentsHomePreview />
        </div>
      )}
      {hasPreferredGames && showPokemonPocket && (
        <>
          <Separator />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
            <PocketHomePreview userId={user.id} />
            <PocketTournamentsHomePreview />
          </div>
        </>
      )}
    </>
  );
}
