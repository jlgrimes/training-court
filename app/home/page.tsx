'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecoilValue } from 'recoil';
import { BattleLogsHomePreview } from '@/components/battle-logs/BattleLogsHome/BattleLogsHomePreview';
import { TournamentsHomePreview } from '@/components/tournaments/TournamentsHome/TournamentsHomePreview';
import { TrainingCourtWelcome } from '@/components/TrainingCourtWelcome';
import { GamePreferences } from '@/components/preferences/GamePreferences';
import { isGameEnabled } from '@/lib/game-preferences';
import { PocketHomePreview } from '@/components/pocket/PocketHomePreview';
import { PocketTournamentsHomePreview } from '@/components/pocket/tournaments/PocketTournamentsHomePreview';
import { Separator } from '@/components/ui/separator';
import { usePreferredGames } from '@/hooks/useGameGuard';
import { useUiRefresh } from '@/hooks/useUiRefresh';
import { getLoggedOutHomeState } from '@/lib/ui-refresh';
import { authLoadingAtom, userAtom } from '@/app/recoil/atoms/user';
import { LandingPageContent } from '@/components/landing/LandingPageContent';

export default function Home() {
  const user = useRecoilValue(userAtom);
  const authLoading = useRecoilValue(authLoadingAtom);
  const { enabled: uiRefreshEnabled, ready: uiRefreshReady } = useUiRefresh();
  const router = useRouter();
  const { preferredGames, loading: prefsLoading } = usePreferredGames();

  const homeState = getLoggedOutHomeState({
    authLoading,
    isLoggedIn: Boolean(user),
    uiRefreshReady,
    uiRefreshEnabled,
  });

  useEffect(() => {
    if (homeState === 'redirect') {
      router.push('/login');
    }
  }, [homeState, router]);

  if (homeState === 'wait' || homeState === 'redirect') return null;
  if (homeState === 'landing') return <LandingPageContent />;
  if (!user || prefsLoading) return null;

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
