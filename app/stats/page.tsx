import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { MatchupsOverview } from '@/components/premium/matchups/MatchupsOverview';

export default async function Stats() {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  return (
    <MatchupsOverview userId={user.id} shouldDisableDrillDown />
  );
}
