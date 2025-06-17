import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { BattleLogsHomePreview } from '@/components/battle-logs/BattleLogsHome/BattleLogsHomePreview';
import { TournamentsHomePreview } from '@/components/tournaments/TournamentsHome/TournamentsHomePreview';
import { isPremiumUser } from '@/components/premium/premium.utils';
import { MatchupsOverview } from '@/components/premium/matchups/MatchupsOverview';
import { TrainingCourtWelcome } from '@/components/TrainingCourtWelcome';

export default async function Profile() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  return (
    <>
      <TrainingCourtWelcome userId={user.id} />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
        <BattleLogsHomePreview userId={user.id} />
        <TournamentsHomePreview user={user} />
      </div>
      {isPremiumUser(user.id) && (
        <MatchupsOverview userId={user.id} shouldDisableDrillDown />
      )}
    </>
  );
}
