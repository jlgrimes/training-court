import { BattleLogsContainerRecoil } from '@/components/battle-logs/BattleLogsContainerRecoil';
import { Header } from '@/components/ui/header';
import { ActiveDeckIndicator } from '@/components/decks/ActiveDeckIndicator';
import { createClient } from '@/utils/supabase/server';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logs',
};

export default async function LogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header description='Record your PTCG Live battle logs'>Logs</Header>
      {user && (
        <div className="mb-4">
          <ActiveDeckIndicator userId={user.id} />
        </div>
      )}
      <BattleLogsContainerRecoil />
    </>
  );
}