import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';

export default async function PocketStatsPage() {
  const user = await fetchCurrentUser();
  if (!user) {
    return redirect('/');
  }

  const preferredGames = await fetchPreferredGames(user.id);
  if (!isGameEnabled(preferredGames, 'pokemon-pocket')) {
    return redirect('/preferences');
  }

  return (
    <div className='p-4 text-sm text-muted-foreground border rounded-md'>
      Pocket stats coming soon.
    </div>
  );
}
