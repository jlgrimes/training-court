import { redirect } from 'next/navigation';

import { fetchCurrentUser } from '@/components/auth.utils';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';
import { createClient } from '@/utils/supabase/server';
import { PocketTournamentContainer } from '@/components/pocket/tournaments/PocketTournamentContainer';

export default async function PocketTournamentPage({ params }: { params: { id: string } }) {
  const user = await fetchCurrentUser();

  if (!user) {
    return redirect('/');
  }

  const preferredGames = await fetchPreferredGames(user.id);
  if (!isGameEnabled(preferredGames, 'pokemon-pocket')) {
    return redirect('/preferences');
  }

  const supabase = createClient();
  const { data: tournament } = await supabase
    .from('pocket_tournaments')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!tournament) {
    return redirect('/pocket/tournaments');
  }

  const { data: rounds } = await supabase
    .from('pocket_tournament_rounds')
    .select('*')
    .eq('tournament', params.id)
    .order('round_num', { ascending: true });

  return (
    <PocketTournamentContainer
      tournament={tournament}
      rounds={rounds ?? []}
      currentUserId={user.id}
    />
  );
}
