import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { BattleLogsHomePreview } from '@/components/battle-logs/BattleLogsHome/BattleLogsHomePreview';
import { TournamentsHomePreview } from '@/components/tournaments/TournamentsHome/TournamentsHomePreview';
import { isPremiumUser } from '@/components/premium/premium.utils';
import { MatchupsOverview } from '@/components/premium/matchups/MatchupsOverview';
import { TrainingCourtWelcome } from '@/components/TrainingCourtWelcome';

export default async function Stats() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  return (
    <MatchupsOverview userId={user.id} shouldDisableDrillDown />
  );
}
