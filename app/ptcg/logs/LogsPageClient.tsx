'use client';

import { BattleLogsContainer } from '@/components/battle-logs/BattleLogsContainer';
import { Header } from '@/components/ui/header';
import { TranslatedText } from '@/components/general-translation/TranslatedText';
import { useGameGuard } from '@/hooks/useGameGuard';

export function LogsPageClient() {
  const { user, loading } = useGameGuard('pokemon-tcg');

  if (loading || !user) return null;

  return (
    <>
      <Header description={<TranslatedText id="battleLogs.description">Record your PTCG Live battle logs</TranslatedText>}>
        <TranslatedText id="battleLogs.header">PTCG Logs</TranslatedText>
      </Header>
      <BattleLogsContainer
        userId={user.id}
        allowPagination={true}
      />
    </>
  );
}
