'use client';

import { BattleLogsContainer } from '@/components/battle-logs/BattleLogsContainer';
import { Header } from '@/components/ui/header';
import { useGameGuard } from '@/hooks/useGameGuard';

export function LogsPageClient() {
  const { user, loading } = useGameGuard('pokemon-tcg');

  if (loading || !user) return null;

  return (
    <>
      <Header description='Record your PTCG Live battle logs'>PTCG Logs</Header>
      <BattleLogsContainer userId={user.id} />
    </>
  );
}
