import { fetchCurrentUser } from '@/components/auth.utils';
import { BattleLogsContainer } from '@/components/battle-logs/BattleLogsContainer';
import { Header } from '@/components/ui/header';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { fetchPreferredGames, fetchUserData } from '@/components/user-data.utils';
import { isGameEnabled } from '@/lib/game-preferences';
import { fetchBattleLogsServer } from '@/lib/server/home-data';

export const metadata: Metadata = {
  title: 'Logs',
};

export default async function LogsPage() {
  const currentUser = await fetchCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  // Fetch all data in parallel
  const [preferredGames, userData, initialLogs] = await Promise.all([
    fetchPreferredGames(currentUser.id),
    fetchUserData(currentUser.id),
    fetchBattleLogsServer(currentUser.id, 0, 5),
  ]);

  if (!isGameEnabled(preferredGames, 'pokemon-tcg')) {
    redirect('/preferences');
  }

  return (
    <>
      <Header description='Record your PTCG Live battle logs'>PTCG Logs</Header>
      <BattleLogsContainer
        userId={currentUser.id}
        allowPagination={true}
        initialLogs={initialLogs}
        initialUserData={userData}
      />
    </>
  );
}
