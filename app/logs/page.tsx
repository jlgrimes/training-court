import { fetchCurrentUser } from '@/components/auth.utils';
import { BattleLogsContainer } from '@/components/battle-logs/BattleLogsContainer';
import { Header } from '@/components/ui/header';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { fetchPreferredGames } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';

export const metadata: Metadata = {
  title: 'Logs',
};

export default async function LogsPage() {
  const currentUser = await fetchCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  const preferredGames = await fetchPreferredGames(currentUser.id);
  if (!isGameEnabled(preferredGames, 'pokemon-tcg')) {
    redirect('/preferences');
  }

  return (
    <>
      <Header description='Record your PTCG Live battle logs'>Logs</Header>
      <BattleLogsContainer userId={currentUser.id} />
    </>
  );
}
