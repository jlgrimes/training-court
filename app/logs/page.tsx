import { fetchCurrentUser } from '@/components/auth.utils';
import { BattleLogsContainer } from '@/components/battle-logs/BattleLogsContainer';
import { Header } from '@/components/ui/header';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Logs',
};

export default async function LogsPage() {
  const currentUser = await fetchCurrentUser();

  if (!currentUser) {
    redirect('/');
  }

  return (
    <>
      <Header description='Record your PTCG Live battle logs'>Logs</Header>
      <BattleLogsContainer userId={currentUser.id} />
    </>
  );
}
